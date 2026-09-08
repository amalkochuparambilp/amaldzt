import fs from 'fs';
import path from 'path';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramReply(chatId: string | number, text: string) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
  } catch (err) {
    console.error('Failed to send Telegram reply:', err);
  }
}

export default async function handler(req: any, res?: any) {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
  };

  // Check if Web Standard (Edge) or Node.js
  const isWebStandard = req instanceof Request || (!res && typeof (req as any)?.headers?.get === 'function');

  if (isWebStandard && (req as Request).method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (!isWebStandard && req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Allow GET to check webhook health
  const method = isWebStandard ? (req as Request).method : req.method;
  if (method === 'GET') {
    const payload = { ok: true, message: 'Telegram webhook receiver ready' };
    if (isWebStandard) {
      return new Response(JSON.stringify(payload), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return res.status(200).json(payload);
  }

  if (method !== 'POST') {
    if (isWebStandard) {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let update: any;
    if (isWebStandard) {
      update = await (req as Request).json().catch(() => ({}));
    } else {
      update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    }

    const message = update.message || update.edited_message;
    if (!message || !message.text) {
      // Return 200 OK to Telegram for non-text events
      if (isWebStandard) {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
      }
      return res.status(200).json({ ok: true });
    }

    const senderChatId = String(message.chat?.id || '');
    const senderUserId = String(message.from?.id || '');
    const expectedChatId = String(CHAT_ID || '').trim();

    // Security Check: Only the authorized admin chat or user ID can update website notices
    const isAuthorized = Boolean(
      expectedChatId && (senderChatId === expectedChatId || senderUserId === expectedChatId)
    );

    const rawText = String(message.text || '').trim();
    const commandMatch = rawText.match(/^\/([a-zA-Z0-9_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/);

    if (commandMatch) {
      const command = commandMatch[1].toLowerCase();
      const args = (commandMatch[2] || '').trim();

      if (command === 'update' || command === 'notice' || command === 'broadcast') {
        if (!isAuthorized) {
          await sendTelegramReply(
            message.chat.id,
            '⛔ *Access Denied*\n\nOnly the authorized website owner can broadcast notices to the website.'
          );
          const okPayload = { ok: true, status: 'unauthorized' };
          if (isWebStandard) return new Response(JSON.stringify(okPayload), { status: 200, headers: corsHeaders });
          return res.status(200).json(okPayload);
        }

        // Subcommand: Clear / Off
        if (!args || args.toLowerCase() === 'help') {
          await sendTelegramReply(
            message.chat.id,
            '📢 *Website Live Notice System*\n\n' +
            'Use `/update <message>` to display a live popup notice to all website visitors.\n\n' +
            '*Commands:*\n' +
            '• `/update <your message>` — Broadcast new popup notice\n' +
            '• `/update clear` — Remove the active notice\n' +
            '• `/update status` — View currently active notice\n\n' +
            '*Example:*\n' +
            '`/update Welcome to DZt! Our new P2P file sharing app is live.`'
          );
        } else if (args.toLowerCase() === 'clear' || args.toLowerCase() === 'off' || args.toLowerCase() === 'remove') {
          const noticeData = {
            id: 'cleared_' + Date.now(),
            message: '',
            author: message.from?.first_name || 'Amal K P',
            timestamp: Date.now(),
            active: false
          };

          try {
            const noticePath = path.join(process.cwd(), 'public', 'notice.json');
            fs.writeFileSync(noticePath, JSON.stringify(noticeData, null, 2), 'utf8');
          } catch (e) {
            console.error('Failed to write notice file:', e);
          }

          await sendTelegramReply(
            message.chat.id,
            '✅ *Website Notice Cleared*\n\nThe active popup notice has been dismissed. Website visitors will no longer see it.'
          );
        } else if (args.toLowerCase() === 'status') {
          let current: any = null;
          try {
            const noticePath = path.join(process.cwd(), 'public', 'notice.json');
            if (fs.existsSync(noticePath)) {
              current = JSON.parse(fs.readFileSync(noticePath, 'utf8'));
            }
          } catch {}

          if (current?.active) {
            await sendTelegramReply(
              message.chat.id,
              `ℹ️ *Active Website Notice:*\n\n"${current.message}"\n\n` +
              `• Author: ${current.author || 'Amal K P'}\n` +
              `• Broadcasted: ${new Date(current.timestamp).toLocaleString()}\n\n` +
              `To clear it, send \`/update clear\``
            );
          } else {
            await sendTelegramReply(
              message.chat.id,
              'ℹ️ No active notice is currently displayed on the website.\n\nSend `/update <message>` to broadcast one!'
            );
          }
        } else {
          // New Notice Broadcast!
          const noticeData = {
            id: 'notice_' + Date.now(),
            message: args,
            author: message.from?.first_name || 'Amal K P',
            timestamp: Date.now(),
            active: true,
            type: 'announcement'
          };

          try {
            const noticePath = path.join(process.cwd(), 'public', 'notice.json');
            fs.writeFileSync(noticePath, JSON.stringify(noticeData, null, 2), 'utf8');
          } catch (e) {
            console.error('Failed to write notice file:', e);
          }

          await sendTelegramReply(
            message.chat.id,
            `📢 *Live Notice Broadcasted!*\n\n"${args}"\n\n` +
            `✅ All visitors on https://amalkp.online will now see this popup notice.\n` +
            `To remove it, send \`/update clear\``
          );
        }
      } else if (command === 'notification' || command === 'notify' || command === 'banner' || command === 'topbar') {
        if (!isAuthorized) {
          await sendTelegramReply(
            message.chat.id,
            '⛔ *Access Denied*\n\nOnly the authorized website owner can send notifications to the website.'
          );
          const okPayload = { ok: true, status: 'unauthorized' };
          if (isWebStandard) return new Response(JSON.stringify(okPayload), { status: 200, headers: corsHeaders });
          return res.status(200).json(okPayload);
        }

        // Subcommand: Clear / Off
        if (!args || args.toLowerCase() === 'help') {
          await sendTelegramReply(
            message.chat.id,
            '🔔 *Website Notification Bar System*\n\n' +
            'Use `/notification <message>` to broadcast a sleek notification bar across the top of the website.\n\n' +
            '*Commands:*\n' +
            '• `/notification <your message>` — Display notification on top bar\n' +
            '• `/notification clear` — Remove the notification bar\n' +
            '• `/notification status` — View currently active top bar notification\n\n' +
            '*Example:*\n' +
            '`/notification 🚀 New Project Released: Check out our P2P WebRTC Video Call mini-app!`'
          );
        } else if (args.toLowerCase() === 'clear' || args.toLowerCase() === 'off' || args.toLowerCase() === 'remove') {
          const barData = {
            id: 'cleared_' + Date.now(),
            message: '',
            author: message.from?.first_name || 'Amal K P',
            timestamp: Date.now(),
            active: false
          };

          try {
            const barPath = path.join(process.cwd(), 'public', 'notification-bar.json');
            fs.writeFileSync(barPath, JSON.stringify(barData, null, 2), 'utf8');
          } catch (e) {
            console.error('Failed to write notification-bar file:', e);
          }

          await sendTelegramReply(
            message.chat.id,
            '✅ *Notification Bar Cleared*\n\nThe top notification bar has been removed from the website.'
          );
        } else if (args.toLowerCase() === 'status') {
          let current: any = null;
          try {
            const barPath = path.join(process.cwd(), 'public', 'notification-bar.json');
            if (fs.existsSync(barPath)) {
              current = JSON.parse(fs.readFileSync(barPath, 'utf8'));
            }
          } catch {}

          if (current?.active) {
            await sendTelegramReply(
              message.chat.id,
              `ℹ️ *Active Top Notification Bar:*\n\n"${current.message}"\n\n` +
              `• Author: ${current.author || 'Amal K P'}\n` +
              `• Broadcasted: ${new Date(current.timestamp).toLocaleString()}\n\n` +
              `To clear it, send \`/notification clear\``
            );
          } else {
            await sendTelegramReply(
              message.chat.id,
              'ℹ️ No active notification is currently displayed on the notification bar.\n\nSend `/notification <message>` to broadcast one!'
            );
          }
        } else {
          // New Notification Bar Broadcast!
          const barData = {
            id: 'bar_' + Date.now(),
            message: args,
            author: message.from?.first_name || 'Amal K P',
            timestamp: Date.now(),
            active: true,
            type: 'announcement'
          };

          try {
            const barPath = path.join(process.cwd(), 'public', 'notification-bar.json');
            fs.writeFileSync(barPath, JSON.stringify(barData, null, 2), 'utf8');
          } catch (e) {
            console.error('Failed to write notification-bar file:', e);
          }

          await sendTelegramReply(
            message.chat.id,
            `🔔 *Notification Bar Broadcasted!*\n\n"${args}"\n\n` +
            `✅ All visitors on https://amalkp.online will now see this notification in the top notification bar.\n` +
            `To remove it, send \`/notification clear\``
          );
        }
      } else if (command === 'start' || command === 'help') {
        await sendTelegramReply(
          message.chat.id,
          '👋 *Welcome to Amal K P / DZt Portfolio Bot*\n\n' +
          '*Available Commands:*\n' +
          '• `/notification <message>` — Send notification via top notification bar\n' +
          '• `/notification clear` — Remove top notification bar\n' +
          '• `/notification status` — View active top notification bar\n\n' +
          '• `/update <message>` — Broadcast popup modal notice\n' +
          '• `/update clear` — Remove popup modal notice\n' +
          '• `/update status` — View active popup notice\n\n' +
          '• `/help` — Show this message'
        );
      }
    }

    if (isWebStandard) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('Error handling Telegram webhook:', err);
    if (isWebStandard) {
      return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: corsHeaders });
    }
    return res.status(500).json({ ok: false, error: err.message });
  }
}
