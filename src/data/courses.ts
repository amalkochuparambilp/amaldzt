export interface Course {
  id: string;
  name: string;
  category: CourseCategory;
  level?: string;
  description?: string;
}

export type CourseCategory =
  | 'Certified Courses'
  | 'Diploma Courses'
  | 'GenAI and Specialized Courses'
  | 'Professional Diploma Courses'
  | 'Cloud and Enterprise Courses'
  | 'Other Courses';

export interface CategoryGroup {
  category: CourseCategory;
  courses: Course[];
}

export const COURSE_CATEGORIES: CourseCategory[] = [
  'Certified Courses',
  'Diploma Courses',
  'GenAI and Specialized Courses',
  'Professional Diploma Courses',
  'Cloud and Enterprise Courses',
  'Other Courses'
];

export const COURSES: Course[] = [
  // Certified Courses (1-11)
  {
    id: 'certified-advanced-iot-engineer',
    name: 'Certified Advanced IoT Engineer',
    category: 'Certified Courses',
    level: 'Advanced',
    description: 'Master sensor integration, embedded protocols, cloud IoT backends, and edge computing architectures.'
  },
  {
    id: 'certified-bms-engineer',
    name: 'Certified BMS Engineer',
    category: 'Certified Courses',
    level: 'Professional',
    description: 'Building Management Systems engineering, HVAC automation, smart building integration, and SCADA protocols.'
  },
  {
    id: 'certified-elv-engineer',
    name: 'Certified ELV Engineer',
    category: 'Certified Courses',
    level: 'Professional',
    description: 'Extra Low Voltage engineering covering CCTV, access control, fire alarm systems, and structured cabling.'
  },
  {
    id: 'certified-indian-foreign-accounting-professional',
    name: 'Certified Indian & Foreign Accounting Professional',
    category: 'Certified Courses',
    level: 'Professional',
    description: 'Comprehensive accounting, GST, VAT, corporate taxation, Tally, QuickBooks, and IFRS standards.'
  },
  {
    id: 'certified-industrial-automation-engineer',
    name: 'Certified Industrial Automation Engineer',
    category: 'Certified Courses',
    level: 'Advanced',
    description: 'PLC programming, SCADA, HMI design, VFD drives, industrial fieldbus, and factory automation.'
  },
  {
    id: 'certified-instrumentation-engineer',
    name: 'Certified Instrumentation Engineer',
    category: 'Certified Courses',
    level: 'Advanced',
    description: 'Process instrumentation, calibration, control valves, transmitter loops, and DCS systems.'
  },
  {
    id: 'certified-networking-engineer-linux',
    name: 'Certified Networking Engineer (Linux)',
    category: 'Certified Courses',
    level: 'Professional',
    description: 'Enterprise Linux administration, TCP/IP network architecture, server hardening, DNS, and routing.'
  },
  {
    id: 'certified-networking-engineer-windows',
    name: 'Certified Networking Engineer (Windows)',
    category: 'Certified Courses',
    level: 'Professional',
    description: 'Windows Server, Active Directory DS, Group Policy, Hyper-V, and enterprise hybrid networking.'
  },
  {
    id: 'certified-quality-safety-engineer',
    name: 'Certified Quality & Safety Engineer',
    category: 'Certified Courses',
    level: 'Professional',
    description: 'HSE management, OSHA/NEBOSH guidelines, quality inspection, hazard analysis, and risk mitigation.'
  },
  {
    id: 'certified-quantity-surveyor-quality-control-engineer',
    name: 'Certified Quantity Surveyor & Quality Control Engineer',
    category: 'Certified Courses',
    level: 'Professional',
    description: 'Estimation, BOQ preparation, contract management, site quality control, and civil rate analysis.'
  },
  {
    id: 'certified-vlsi-engineer',
    name: 'Certified VLSI Engineer',
    category: 'Certified Courses',
    level: 'Advanced',
    description: 'Verilog/VHDL, RTL design, digital synthesis, FPGA prototyping, and ASIC verification workflows.'
  },

  // Diploma Courses (12-17)
  {
    id: 'diploma-in-bim-modeler-with-genai',
    name: 'Diploma in BIM Modeler with GenAI',
    category: 'Diploma Courses',
    level: 'Diploma',
    description: 'Revit BIM 3D modeling, clash detection, generative AI design automation, and architectural drafting.'
  },
  {
    id: 'diploma-in-bms',
    name: 'Diploma in BMS',
    category: 'Diploma Courses',
    level: 'Diploma',
    description: 'Hands-on Building Management Systems operations, DDC controllers, HVAC circuits, and facility monitoring.'
  },
  {
    id: 'diploma-in-instrumentation-control-systems',
    name: 'Diploma in Instrumentation & Control Systems',
    category: 'Diploma Courses',
    level: 'Diploma',
    description: 'Industrial sensors, feedback loops, PLC-DCS interfacing, and process safety instrumented systems.'
  },
  {
    id: 'diploma-in-interior-designing-with-genai',
    name: 'Diploma in Interior Designing with GenAI',
    category: 'Diploma Courses',
    level: 'Diploma',
    description: 'Spatial planning, 3D visualization, material curation, and generative AI concept rendering.'
  },
  {
    id: 'diploma-in-oil-gas-technician',
    name: 'Diploma in Oil & Gas Technician',
    category: 'Diploma Courses',
    level: 'Diploma',
    description: 'Petroleum production operations, refinery equipment maintenance, piping codes, and offshore safety.'
  },
  {
    id: 'diploma-indian-foreign-accounting-professional',
    name: 'Diploma Indian & Foreign Accounting Professional',
    category: 'Diploma Courses',
    level: 'Diploma',
    description: 'Comprehensive financial reporting, international tax compliances, audit trails, and ERP accounting suites.'
  },

  // GenAI and Specialized Courses (18-20)
  {
    id: 'genai-integrated-graphic-designing-video-editing',
    name: 'GenAI Integrated Graphic Designing & Video Editing',
    category: 'GenAI and Specialized Courses',
    level: 'Specialized',
    description: 'Adobe Creative Suite, Premiere Pro, DaVinci Resolve, Midjourney, Runway, and generative video pipelines.'
  },
  {
    id: 'industrial-robotics-with-genai',
    name: 'Industrial Robotics with GenAI',
    category: 'GenAI and Specialized Courses',
    level: 'Specialized',
    description: 'Robotic arm kinematics, trajectory generation, computer vision guidance, and AI-driven path planning.'
  },
  {
    id: 'master-program-in-film-editing-post-production-with-genai',
    name: 'Master Program in Film Editing & Post Production with GenAI',
    category: 'GenAI and Specialized Courses',
    level: 'Master Program',
    description: 'Cinematic storytelling, color grading, sound engineering, VFX composites, and generative film enhancement.'
  },

  // Professional Diploma Courses (21-30)
  {
    id: 'professional-diploma-in-corporate-account-management-with-genai',
    name: 'Professional Diploma in Corporate Account Management with GenAI',
    category: 'Professional Diploma Courses',
    level: 'Professional Diploma',
    description: 'Corporate client portfolio management, financial risk analysis, automated reporting, and CRM AI tools.'
  },
  {
    id: 'professional-diploma-in-cpm-bim-modeler-with-genai',
    name: 'Professional Diploma in CPM & BIM Modeler with GenAI',
    category: 'Professional Diploma Courses',
    level: 'Professional Diploma',
    description: 'Critical Path Method project scheduling, Primavera P6, Revit BIM coordination, and 4D/5D simulations.'
  },
  {
    id: 'professional-diploma-in-cyber-security-with-genai',
    name: 'Professional Diploma in Cyber Security with GenAI',
    category: 'Professional Diploma Courses',
    level: 'Professional Diploma',
    description: 'Threat hunting, SOC operations, ethical hacking, generative AI attack detection, and defense in depth.'
  },
  {
    id: 'professional-diploma-in-digital-marketing-with-genai',
    name: 'Professional Diploma in Digital Marketing with GenAI',
    category: 'Professional Diploma Courses',
    level: 'Professional Diploma',
    description: 'Performance marketing, programmatic advertising, generative content strategies, SEO/SEM, and attribution.'
  },
  {
    id: 'professional-diploma-in-embedded-firmware-with-genai',
    name: 'Professional Diploma in Embedded Firmware with GenAI',
    category: 'Professional Diploma Courses',
    level: 'Professional Diploma',
    description: 'ARM Cortex programming, RTOS kernel integration, driver development, and AI-assisted firmware synthesis.'
  },
  {
    id: 'professional-diploma-in-financial-data-analyst-with-genai',
    name: 'Professional Diploma in Financial Data Analyst with GenAI',
    category: 'Professional Diploma Courses',
    level: 'Professional Diploma',
    description: 'Python financial modeling, SQL data lakes, quantitative risk forecasting, and LLM-assisted equity research.'
  },
  {
    id: 'professional-diploma-in-industrial-automation-with-genai',
    name: 'Professional Diploma in Industrial Automation with GenAI',
    category: 'Professional Diploma Courses',
    level: 'Professional Diploma',
    description: 'Industry 4.0 architecture, smart sensors, automated defect classification, and predictive maintenance.'
  },
  {
    id: 'professional-diploma-in-industrial-fire-safety',
    name: 'Professional Diploma in Industrial Fire & Safety',
    category: 'Professional Diploma Courses',
    level: 'Professional Diploma',
    description: 'Plant safety audit, HAZOP methodology, fire suppression design, emergency response, and industrial hygiene.'
  },
  {
    id: 'professional-diploma-in-mep-bim-engineer',
    name: 'Professional Diploma in MEP & BIM Engineer',
    category: 'Professional Diploma Courses',
    level: 'Professional Diploma',
    description: 'Mechanical, Electrical, and Plumbing engineering design, Revit MEP coordination, and clash resolution.'
  },
  {
    id: 'professional-diploma-in-oil-and-gas-with-project-management',
    name: 'Professional Diploma in Oil and Gas with Project Management',
    category: 'Professional Diploma Courses',
    level: 'Professional Diploma',
    description: 'Upstream/downstream engineering, EPC project governance, supply chain logistics, and HSE compliance.'
  },

  // Cloud and Enterprise Courses (31-34)
  {
    id: 'professional-linux-aws-cloud-architect',
    name: 'Professional Linux & AWS Cloud Architect',
    category: 'Cloud and Enterprise Courses',
    level: 'Architect',
    description: 'Enterprise AWS infrastructure, Terraform IaC, Kubernetes clusters, VPC peering, and high availability.'
  },
  {
    id: 'professional-microsoft-azure-cloud-architect',
    name: 'Professional Microsoft & Azure Cloud Architect',
    category: 'Cloud and Enterprise Courses',
    level: 'Architect',
    description: 'Azure Enterprise architecture, Entra ID, hybrid cloud migrations, BCDR design, and Azure DevOps.'
  },
  {
    id: 'sap-certified-application-associate-sap-s4hana-finance',
    name: 'SAP Certified Application Associate (SAP S/4HANA Finance)',
    category: 'Cloud and Enterprise Courses',
    level: 'Enterprise Associate',
    description: 'General ledger, accounts payable/receivable, asset accounting, financial closing, and S/4HANA reporting.'
  },
  {
    id: 'sap-certified-application-associate-sap-s4hana-mm',
    name: 'SAP Certified Application Associate (SAP S/4HANA MM)',
    category: 'Cloud and Enterprise Courses',
    level: 'Enterprise Associate',
    description: 'Procurement processes, inventory management, material master, purchase orders, and invoice verification.'
  },

  // Other Courses (35)
  {
    id: 'ship-automation-engineer',
    name: 'Ship Automation Engineer',
    category: 'Other Courses',
    level: 'Marine Engineering',
    description: 'Marine electrical control, propulsion automation, vessel navigation telemetry, and offshore power systems.'
  }
];

export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  minLength: number;
  maxLength: number;
}

export const COUNTRY_CODES: CountryCode[] = [
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', placeholder: '9876543210', minLength: 10, maxLength: 10 },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', placeholder: '501234567', minLength: 9, maxLength: 9 },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦', placeholder: '512345678', minLength: 9, maxLength: 9 },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦', placeholder: '33123456', minLength: 8, maxLength: 8 },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲', placeholder: '91234567', minLength: 8, maxLength: 8 },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼', placeholder: '91234567', minLength: 8, maxLength: 8 },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭', placeholder: '36123456', minLength: 8, maxLength: 8 },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', placeholder: '7911123456', minLength: 10, maxLength: 10 },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', placeholder: '2025550123', minLength: 10, maxLength: 10 },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', placeholder: '4165550123', minLength: 10, maxLength: 10 },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', placeholder: '81234567', minLength: 8, maxLength: 8 },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', placeholder: '123456789', minLength: 9, maxLength: 10 },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', placeholder: '412345678', minLength: 9, maxLength: 9 },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', placeholder: '1512345678', minLength: 10, maxLength: 11 },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷', placeholder: '612345678', minLength: 9, maxLength: 9 },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪', placeholder: '851234567', minLength: 9, maxLength: 9 },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿', placeholder: '21123456', minLength: 8, maxLength: 10 },
  { name: 'Maldives', code: 'MV', dialCode: '+960', flag: '🇲🇻', placeholder: '7123456', minLength: 7, maxLength: 7 },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰', placeholder: '712345678', minLength: 9, maxLength: 9 },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵', placeholder: '9812345678', minLength: 10, maxLength: 10 }
];

export function getCoursesGrouped(): CategoryGroup[] {
  return COURSE_CATEGORIES.map((cat) => ({
    category: cat,
    courses: COURSES.filter((c) => c.category === cat)
  })).filter((group) => group.courses.length > 0);
}

export function findCourseByNameOrId(query: string): Course | undefined {
  const q = query.trim().toLowerCase();
  return COURSES.find((c) => c.name.toLowerCase() === q || c.id === q);
}
