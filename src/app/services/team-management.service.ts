import { Injectable } from '@angular/core';
import { TeamDataService } from './team-data.service';
import { 
  TeamData, Manager, Team, Developer, SkillDefinitions, 
  ManagerFormData, TeamFormData, DeveloperFormData, SkillFormData,
  VacationDay, TechSkills, AppSkills
} from '../models/team-models';

@Injectable({
  providedIn: 'root'
})
export class TeamManagementService {

  constructor(private teamDataService: TeamDataService) { }

  // ==================== MANAGER CRUD OPERATIONS ====================
  
  addManager(managerData: ManagerFormData): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const newManager: Manager = {
      id: this.generateId('mgr'),
      ...managerData
    };

    const updatedData: TeamData = {
      ...currentData,
      managers: [...currentData.managers, newManager]
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  updateManager(id: string, managerData: ManagerFormData): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const updatedManagers = currentData.managers.map(manager =>
      manager.id === id ? { ...manager, ...managerData } : manager
    );

    const updatedData: TeamData = {
      ...currentData,
      managers: updatedManagers
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  deleteManager(id: string): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    // Remove manager from teams
    const updatedTeams = currentData.teams.map(team => {
      if (team.managerId === id) {
        return { ...team, managerId: '' };
      }
      return team;
    });

    const updatedData: TeamData = {
      ...currentData,
      managers: currentData.managers.filter(manager => manager.id !== id),
      teams: updatedTeams
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  // ==================== TEAM CRUD OPERATIONS ====================

  addTeam(teamData: TeamFormData): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const newTeam: Team = {
      id: this.generateId('team'),
      ...teamData
    };

    const updatedData: TeamData = {
      ...currentData,
      teams: [...currentData.teams, newTeam]
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  updateTeam(id: string, teamData: TeamFormData): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const updatedTeams = currentData.teams.map(team =>
      team.id === id ? { ...team, ...teamData } : team
    );

    const updatedData: TeamData = {
      ...currentData,
      teams: updatedTeams
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  deleteTeam(id: string): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    // Remove team from developers
    const updatedDevelopers = currentData.developers.map(developer => {
      if (developer.teamId === id) {
        return { ...developer, teamId: null };
      }
      if (developer.assignedTeams?.includes(id)) {
        return {
          ...developer,
          assignedTeams: developer.assignedTeams.filter(teamId => teamId !== id)
        };
      }
      return developer;
    });

    const updatedData: TeamData = {
      ...currentData,
      teams: currentData.teams.filter(team => team.id !== id),
      developers: updatedDevelopers
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  // ==================== DEVELOPER CRUD OPERATIONS ====================

  addDeveloper(developerData: DeveloperFormData): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const newDeveloper: Developer = {
      id: this.generateId('dev'),
      ...developerData,
      availability: {
        status: 'active',
        vacationDays: []
      }
    };

    const updatedData: TeamData = {
      ...currentData,
      developers: [...currentData.developers, newDeveloper]
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  updateDeveloper(id: string, developerData: DeveloperFormData): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const updatedDevelopers = currentData.developers.map(developer =>
      developer.id === id ? { ...developer, ...developerData } : developer
    );

    const updatedData: TeamData = {
      ...currentData,
      developers: updatedDevelopers
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  deleteDeveloper(id: string): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    // Remove developer from teams
    const updatedTeams = currentData.teams.map(team => ({
      ...team,
      developers: team.developers.filter(devId => devId !== id),
      sharedResources: team.sharedResources.filter(devId => devId !== id)
    }));

    const updatedData: TeamData = {
      ...currentData,
      teams: updatedTeams,
      developers: currentData.developers.filter(developer => developer.id !== id)
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  // ==================== SKILLS CRUD OPERATIONS ====================

  addTechSkill(skillData: SkillFormData): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const updatedSkillDefinitions: SkillDefinitions = {
      ...currentData.skillDefinitions,
      techSkills: {
        ...currentData.skillDefinitions.techSkills,
        [skillData.name]: {
          description: skillData.description,
          scale: skillData.scale,
          category: skillData.category
        }
      }
    };

    const updatedData: TeamData = {
      ...currentData,
      skillDefinitions: updatedSkillDefinitions
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  addAppSkill(skillData: SkillFormData): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const updatedSkillDefinitions: SkillDefinitions = {
      ...currentData.skillDefinitions,
      appSkills: {
        ...currentData.skillDefinitions.appSkills,
        [skillData.name]: {
          description: skillData.description,
          scale: skillData.scale,
          category: skillData.category
        }
      }
    };

    const updatedData: TeamData = {
      ...currentData,
      skillDefinitions: updatedSkillDefinitions
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  deleteTechSkill(skillName: string): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const { [skillName]: removed, ...remainingTechSkills } = currentData.skillDefinitions.techSkills;

    // Remove skill from all developers
    const updatedDevelopers = currentData.developers.map(developer => {
      const { [skillName]: removedSkill, ...remainingSkills } = developer.techSkills;
      return { ...developer, techSkills: remainingSkills };
    });

    const updatedData: TeamData = {
      ...currentData,
      skillDefinitions: {
        ...currentData.skillDefinitions,
        techSkills: remainingTechSkills
      },
      developers: updatedDevelopers
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  deleteAppSkill(skillName: string): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const { [skillName]: removed, ...remainingAppSkills } = currentData.skillDefinitions.appSkills;

    // Remove skill from all developers
    const updatedDevelopers = currentData.developers.map(developer => {
      const { [skillName]: removedSkill, ...remainingSkills } = developer.appSkills;
      return { ...developer, appSkills: remainingSkills };
    });

    const updatedData: TeamData = {
      ...currentData,
      skillDefinitions: {
        ...currentData.skillDefinitions,
        appSkills: remainingAppSkills
      },
      developers: updatedDevelopers
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  // ==================== VACATION CRUD OPERATIONS ====================

  addVacation(developerId: string, vacation: VacationDay): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const updatedDevelopers = currentData.developers.map(developer => {
      if (developer.id === developerId) {
        return {
          ...developer,
          availability: {
            ...developer.availability,
            vacationDays: [...developer.availability.vacationDays, vacation]
          }
        };
      }
      return developer;
    });

    const updatedData: TeamData = {
      ...currentData,
      developers: updatedDevelopers
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  updateVacation(developerId: string, vacationIndex: number, vacation: VacationDay): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const updatedDevelopers = currentData.developers.map(developer => {
      if (developer.id === developerId) {
        const updatedVacationDays = [...developer.availability.vacationDays];
        updatedVacationDays[vacationIndex] = vacation;
        return {
          ...developer,
          availability: {
            ...developer.availability,
            vacationDays: updatedVacationDays
          }
        };
      }
      return developer;
    });

    const updatedData: TeamData = {
      ...currentData,
      developers: updatedDevelopers
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  deleteVacation(developerId: string, vacationIndex: number): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const updatedDevelopers = currentData.developers.map(developer => {
      if (developer.id === developerId) {
        const updatedVacationDays = developer.availability.vacationDays.filter((_, index) => index !== vacationIndex);
        return {
          ...developer,
          availability: {
            ...developer.availability,
            vacationDays: updatedVacationDays
          }
        };
      }
      return developer;
    });

    const updatedData: TeamData = {
      ...currentData,
      developers: updatedDevelopers
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  // ==================== UTILITY METHODS ====================

  private generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}`;
  }

  // ==================== SKILL RATING OPERATIONS ====================

  updateDeveloperTechSkill(developerId: string, skillName: string, rating: number): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const updatedDevelopers = currentData.developers.map(developer => {
      if (developer.id === developerId) {
        return {
          ...developer,
          techSkills: {
            ...developer.techSkills,
            [skillName]: rating
          }
        };
      }
      return developer;
    });

    const updatedData: TeamData = {
      ...currentData,
      developers: updatedDevelopers
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  updateDeveloperAppSkill(developerId: string, skillName: string, rating: number): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    const updatedDevelopers = currentData.developers.map(developer => {
      if (developer.id === developerId) {
        return {
          ...developer,
          appSkills: {
            ...developer.appSkills,
            [skillName]: rating
          }
        };
      }
      return developer;
    });

    const updatedData: TeamData = {
      ...currentData,
      developers: updatedDevelopers
    };

    this.teamDataService.updateTeamData(updatedData);
  }
}
