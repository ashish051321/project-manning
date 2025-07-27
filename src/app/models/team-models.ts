export interface Organization {
  name: string;
  version: string;
  lastUpdated: string;
}

export interface Manager {
  id: string;
  name: string;
  role: string;
  teams: string[];
  description: string;
}

export interface Team {
  id: string;
  name: string;
  managerId: string;
  developers: string[];
  sharedResources: string[];
  description: string;
}

export interface VacationDay {
  type: 'single' | 'range';
  date?: string;
  startDate?: string;
  endDate?: string;
  description: string;
}

export interface Availability {
  status: 'active' | 'inactive';
  vacationDays: VacationDay[];
}

export interface TechSkills {
  Java?: number;
  Angular?: number;
  Data?: number;
  CICD?: number;
  [key: string]: number | undefined;
}

export interface AppSkills {
  'App 1'?: number;
  'App 2'?: number;
  'App 3'?: number;
  [key: string]: number | undefined;
}

export interface Developer {
  id: string;
  name: string;
  teamId: string | null;
  isSharedResource: boolean;
  assignedTeams?: string[];
  techSkills: TechSkills;
  appSkills: AppSkills;
  availability: Availability;
}

export interface SkillDefinition {
  description: string;
  scale: string;
  category: string;
}

export interface SkillDefinitions {
  techSkills: { [key: string]: SkillDefinition };
  appSkills: { [key: string]: SkillDefinition };
}

export interface Metadata {
  skillScales: {
    techSkillsScale: string;
    appSkillsScale: string;
  };
  defaultTechSkillRating: number;
  defaultAppSkillRating: number;
  sharedResourceIndicator: string;
  vacationTracking: boolean;
}

export interface TeamData {
  organization: Organization;
  managers: Manager[];
  teams: Team[];
  developers: Developer[];
  skillDefinitions: SkillDefinitions;
  metadata: Metadata;
}

// Form interfaces for CRUD operations
export interface ManagerFormData {
  name: string;
  role: string;
  teams: string[];
  description: string;
}

export interface TeamFormData {
  name: string;
  managerId: string;
  developers: string[];
  sharedResources: string[];
  description: string;
}

export interface DeveloperFormData {
  name: string;
  teamId: string | null;
  isSharedResource: boolean;
  assignedTeams: string[];
  techSkills: TechSkills;
  appSkills: AppSkills;
  availability: Availability;
}

export interface SkillFormData {
  name: string;
  description: string;
  category: string;
  scale: string;
}
