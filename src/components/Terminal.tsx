import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal as TerminalIcon, Maximize2, Minimize2, RefreshCw, X, ChevronRight } from 'lucide-react';
import { AMAL_INFO, PROJECTS, SKILLS } from '../data';
import { TerminalLog } from '../types';

export default function Terminal() {
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'welcome',
      type: 'system',
      text: 'DZt OS Kernel v1.4.2 [Ready]. Type "help" to list available commands.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMatrixActive, setIsMatrixActive] = useState(false);
  
  // Interactive email form flow within the terminal
  const [formStep, setFormStep] = useState<null | 'email' | 'message' | 'sending'>(null);
  const [formData, setFormData] = useState({ email: '', message: '' });

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);

  // Focus terminal input
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    focusInput();
  }, [formStep]);

  // Scroll to bottom on log updates
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Command executor
  const executeCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Save in command history
    const updatedHistory = [...commandHistory, trimmed];
    setCommandHistory(updatedHistory);
    setHistoryIndex(-1);

    // Append user input log
    const userLog: TerminalLog = {
      id: `input-${Date.now()}`,
      type: 'input',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString()
    };

    setLogs(prev => [...prev, userLog]);
    setInput('');

    const cmdParts = trimmed.toLowerCase().split(' ');
    const cmd = cmdParts[0];
    const arg = cmdParts[1];

    // Handle interactive contact CLI form inputs
    if (formStep === 'email') {
      if (!trimmed.includes('@') || !trimmed.includes('.')) {
        addLog('error', 'Invalid email address. Please re-enter email:');
        return;
      }
      setFormData(prev => ({ ...prev, email: trimmed }));
      addLog('success', `Email registered: ${trimmed}`);
      addLog('system', 'Please enter your message:');
      setFormStep('message');
      return;
    }

    if (formStep === 'message') {
      setFormData(prev => ({ ...prev, message: trimmed }));
      addLog('success', 'Message compiled.');
      addLog('system', 'Syncing message with DZt relay server...');
      setFormStep('sending');
      
      // Simulate sending
      setTimeout(() => {
        addLog('success', `Relay complete! Message sent successfully. Thank you, I will contact you back at ${formData.email || trimmed}.`);
        setFormStep(null);
        setFormData({ email: '', message: '' });
      }, 1500);
      return;
    }

    // Standard commands switcher
    switch (cmd) {
      case 'help':
        addLog('system', '--- DZt OS Shell v1.4.2 Commands ---');
        addLog('output', 'about    - Display Amal K P detailed biography');
        addLog('output', 'projects - Show portfolio projects. Usage: "projects" or "projects <id>"');
        addLog('output', 'skills   - View capability matrix as ASCII charts');
        addLog('output', 'dzt      - Print the DZt ecosystem manifesto');
        addLog('output', 'contact  - Securely relay messages directly within the terminal');
        addLog('output', 'matrix   - Toggle simulated screensaver digital matrix rain');
        addLog('output', 'clear    - Flush the terminal scroll history');
        addLog('output', 'exit     - Terminate CLI terminal sessions');
        break;

      case 'about':
        addLog('success', `NAME: ${AMAL_INFO.name}`);
        addLog('output', `TITLE: ${AMAL_INFO.title}`);
        addLog('output', `COLLEGE: ${AMAL_INFO.college}`);
        addLog('output', `LOCATION: ${AMAL_INFO.location}`);
        addLog('output', `BIO: ${AMAL_INFO.bio}`);
        addLog('output', 'DZt Philosophy: "Symmetry. Simplicity. Speed."');
        break;

      case 'projects':
        if (!arg) {
          addLog('system', '--- PROJECTS SHOWCASE ---');
          PROJECTS.forEach(proj => {
            addLog('output', `${proj.id.padEnd(20)} | ${proj.title} [${proj.category.toUpperCase()}]`);
          });
          addLog('system', 'Type "projects <id>" (e.g., "projects dzt-os") to read details.');
        } else {
          const found = PROJECTS.find(p => p.id === arg);
          if (found) {
            addLog('success', `TITLE: ${found.title}`);
            addLog('output', `CATEGORY: ${found.category.toUpperCase()}`);
            addLog('output', `TECH STACK: ${found.tech.join(', ')}`);
            addLog('output', `DESCRIPTION: ${found.longDescription || found.description}`);
            if (found.features) {
              addLog('system', 'FEATURES:');
              found.features.forEach(f => addLog('output', `  - ${f}`));
            }
          } else {
            addLog('error', `Project "${arg}" not found. Type "projects" to list all ids.`);
          }
        }
        break;

      case 'skills':
        addLog('system', '--- AMAL K P TECHNICAL METRIC ---');
        SKILLS.forEach(skill => {
          const filledBlocks = Math.round(skill.level / 10);
          const bar = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);
          addLog('output', `${skill.name.padEnd(25)} [${bar}] ${skill.level}%`);
        });
        break;

      case 'dzt':
        addLog('success', '   ___  _____ _    ');
        addLog('success', '  / _ \\|_  _|| |   ');
        addLog('success', ' | | | | | | | |__ ');
        addLog('success', ' | |_| |_| |_|  _  |');
        addLog('success', '  \\___/\\_____|_| |_|');
        addLog('output', '======================================');
        addLog('output', 'DZt represents the Autonomous Digital Ecosystem.');
        addLog('output', 'Designed to unify speed, accessibility, and mathematical geometry.');
        addLog('output', `Lead Architect: Amal K P.`);
        break;

      case 'contact':
        addLog('system', 'Initiating DZt Relay terminal wizard...');
        addLog('system', 'Please enter your email:');
        setFormStep('email');
        break;

      case 'matrix':
        addLog('success', 'Loading matrix sequence... Click anywhere on matrix to exit.');
        setIsMatrixActive(true);
        break;

      case 'clear':
        setLogs([]);
        break;

      case 'exit':
        addLog('system', 'Closing shell session...');
        // Mock session exit
        setTimeout(() => {
          setLogs([
            {
              id: 'reboot',
              type: 'system',
              text: 'DZt OS Shell terminated. Enter "help" to reboot.',
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
        }, 800);
        break;

      default:
        addLog('error', `Command not recognized: "${cmd}". Type "help" for core instructions.`);
    }
  };

  const addLog = (type: TerminalLog['type'], text: string) => {
    setLogs(prev => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        type,
        text,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Matrix Canvas Render Effect
  useEffect(() => {
    if (!isMatrixActive || !matrixCanvasRef.current) return;
    const canvas = matrixCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 400;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const katakana = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const alphabet = katakana.split('');

    const fontSize = 14;
    const columns = canvas.width / fontSize;

    const rainDrops: number[] = [];
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(7, 7, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#05f3a2'; // Glowing green matrix
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet[Math.floor(Math.random() * alphabet.length)];
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };

    const interval = setInterval(draw, 30);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isMatrixActive]);

  // Input keyboard capture
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(nextIdx);
          setInput(commandHistory[nextIdx]);
        }
      }
    }
  };

  return (
    <section id="terminal-os" className="py-20 px-4 max-w-4xl mx-auto space-y-8">
      <div className="space-y-4 text-center sm:text-left">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-3">
          <span className="w-8 h-[1px] bg-neon-cyan hidden sm:block"></span>
          DZt OS Command Shell
        </h2>
        <p className="text-gray-400 font-light max-w-xl font-sans text-sm sm:text-base">
          A client-side interactive sandbox operating environment. Feel free to navigate the file structures, review biography logs, or execute standard core scripts.
        </p>
      </div>

      {/* Terminal Visual Wrapper */}
      <div 
        id="dzt-os-container"
        onClick={focusInput}
        className="w-full bg-[#050508] border border-cyber-border rounded-xl shadow-2xl relative flex flex-col h-[460px] overflow-hidden"
      >
        {/* Terminal Header Bar */}
        <div className="w-full h-11 bg-cyber-dark border-b border-cyber-border px-4 flex items-center justify-between select-none">
          {/* OS Window Bullets */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-red-500" />
            </span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/50 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-yellow-500" />
            </span>
            <span className="w-3 h-3 rounded-full bg-neon-emerald/30 border border-neon-emerald/50 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-neon-emerald" />
            </span>
          </div>

          {/* Window Title */}
          <div className="flex items-center gap-2 font-mono text-xs text-gray-500 font-medium">
            <TerminalIcon className="w-3.5 h-3.5 text-neon-cyan animate-pulse" />
            <span>dzt@amal-kp:~ (DZt_OS_Shell_v1.4)</span>
          </div>

          {/* Dummy visual tools */}
          <div className="flex items-center gap-3 text-gray-600">
            <Maximize2 className="w-3 h-3 hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>

        {/* Scrollable logs area */}
        <div className="flex-1 p-5 overflow-y-auto font-mono text-xs sm:text-sm space-y-2 relative">
          
          {/* Matrix Screensaver Overlay */}
          <AnimatePresence>
            {isMatrixActive && (
              <div 
                id="matrix-screensaver"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMatrixActive(false);
                  addLog('system', 'Matrix sequence exited.');
                }}
                className="absolute inset-0 z-40 bg-[#07070a] flex flex-col items-center justify-center cursor-pointer"
              >
                <canvas ref={matrixCanvasRef} className="absolute inset-0 w-full h-full" />
                <div className="absolute bottom-6 px-4 py-2 bg-black/80 rounded border border-neon-emerald/30 text-neon-emerald z-50 text-[10px] font-mono tracking-widest uppercase text-center pointer-events-none select-none animate-pulse">
                  SYSTEM DIAGNOSTIC ACTIVE // CLICK ANYWHERE TO TERMINATE MATRIX
                </div>
              </div>
            )}
          </AnimatePresence>

          {logs.map((log) => {
            let typeColor = 'text-gray-300';
            if (log.type === 'input') typeColor = 'text-white';
            if (log.type === 'error') typeColor = 'text-red-400';
            if (log.type === 'success') typeColor = 'text-neon-cyan';
            if (log.type === 'system') typeColor = 'text-neon-purple';

            return (
              <div key={log.id} className="leading-relaxed whitespace-pre-wrap">
                {log.type === 'input' && (
                  <span className="text-neon-cyan mr-2 font-semibold">dzt@amal-kp:~$</span>
                )}
                <span className={typeColor}>{log.text}</span>
              </div>
            );
          })}

          {/* Dynamic input prompt line */}
          <div className="flex items-center text-white">
            <span className="text-neon-cyan mr-2 font-semibold">
              {formStep ? '⚡ CLI_WIZARD_INPUT ->' : 'dzt@amal-kp:~$'}
            </span>
            <input
              ref={inputRef}
              id="terminal-cli-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs sm:text-sm p-0 focus:ring-0"
              autoComplete="off"
              autoCapitalize="none"
              placeholder={formStep ? 'Provide details...' : 'Type "help"...'}
            />
          </div>
          <div ref={terminalEndRef} />
        </div>
      </div>
    </section>
  );
}
