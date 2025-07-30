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

    // Update teams to assign them to the new manager
    const assignedTeamIds = managerData.teams || [];
    const updatedTeams = currentData.teams.map(team => {
      if (assignedTeamIds.includes(team.id)) {
        return { ...team, managerId: newManager.id };
      }
      return team;
    });

    const updatedData: TeamData = {
      ...currentData,
      managers: [...currentData.managers, newManager],
      teams: updatedTeams
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  updateManager(id: string, managerData: ManagerFormData): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    // Get the current manager to compare team assignments
    const currentManager = currentData.managers.find(manager => manager.id === id);
    const currentAssignedTeams = currentManager ? currentManager.teams : [];
    const newAssignedTeams = managerData.teams || [];

    // Update managers
    const updatedManagers = currentData.managers.map(manager =>
      manager.id === id ? { ...manager, ...managerData } : manager
    );

    // Update teams - remove managerId from teams that are no longer assigned
    // and add managerId to newly assigned teams
    const updatedTeams = currentData.teams.map(team => {
      const wasAssigned = currentAssignedTeams.includes(team.id);
      const isNowAssigned = newAssignedTeams.includes(team.id);
      
      if (wasAssigned && !isNowAssigned) {
        // Team was unassigned from this manager
        return { ...team, managerId: '' };
      } else if (!wasAssigned && isNowAssigned) {
        // Team was newly assigned to this manager
        return { ...team, managerId: id };
      }
      return team;
    });

    const updatedData: TeamData = {
      ...currentData,
      managers: updatedManagers,
      teams: updatedTeams
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

    // Update teams to include the new developer
    let updatedTeams = currentData.teams;
    if (developerData.teamId) {
      // Add developer to the assigned team
      updatedTeams = currentData.teams.map(team => {
        if (team.id === developerData.teamId) {
          return {
            ...team,
            developers: [...team.developers, newDeveloper.id]
          };
        }
        return team;
      });
    }

    // Add developer to shared resources for assigned teams
    if (developerData.isSharedResource && developerData.assignedTeams) {
      updatedTeams = updatedTeams.map(team => {
        if (developerData.assignedTeams!.includes(team.id)) {
          return {
            ...team,
            sharedResources: [...team.sharedResources, newDeveloper.id]
          };
        }
        return team;
      });
    }

    const updatedData: TeamData = {
      ...currentData,
      teams: updatedTeams,
      developers: [...currentData.developers, newDeveloper]
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  updateDeveloper(id: string, developerData: DeveloperFormData): void {
    const currentData = this.teamDataService.getCurrentTeamData();
    if (!currentData) return;

    // Get the current developer to compare team assignments
    const currentDeveloper = currentData.developers.find(developer => developer.id === id);
    const currentTeamId = currentDeveloper?.teamId;
    const currentAssignedTeams = currentDeveloper?.assignedTeams || [];

    // Update developers
    const updatedDevelopers = currentData.developers.map(developer =>
      developer.id === id ? { ...developer, ...developerData } : developer
    );

    // Update teams based on team assignment changes
    let updatedTeams = currentData.teams;

    // Handle primary team assignment changes
    if (currentTeamId !== developerData.teamId) {
      // Remove developer from old team
      if (currentTeamId) {
        updatedTeams = updatedTeams.map(team => {
          if (team.id === currentTeamId) {
            return {
              ...team,
              developers: team.developers.filter(devId => devId !== id)
            };
          }
          return team;
        });
      }

      // Add developer to new team
      if (developerData.teamId) {
        updatedTeams = updatedTeams.map(team => {
          if (team.id === developerData.teamId) {
            return {
              ...team,
              developers: [...team.developers, id]
            };
          }
          return team;
        });
      }
    }

    // Handle shared resource assignment changes
    const newAssignedTeams = developerData.assignedTeams || [];
    const teamsToRemove = currentAssignedTeams.filter(teamId => !newAssignedTeams.includes(teamId));
    const teamsToAdd = newAssignedTeams.filter(teamId => !currentAssignedTeams.includes(teamId));

    // Remove developer from teams no longer assigned
    teamsToRemove.forEach(teamId => {
      updatedTeams = updatedTeams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            sharedResources: team.sharedResources.filter(devId => devId !== id)
          };
        }
        return team;
      });
    });

    // Add developer to newly assigned teams
    teamsToAdd.forEach(teamId => {
      updatedTeams = updatedTeams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            sharedResources: [...team.sharedResources, id]
          };
        }
        return team;
      });
    });

    const updatedData: TeamData = {
      ...currentData,
      teams: updatedTeams,
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

  addTechSkill(skillData: SkillFormData, oldSkillName?: string): void {
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

    // If this is an update (oldSkillName provided), remove the old skill name
    if (oldSkillName && oldSkillName !== skillData.name) {
      const { [oldSkillName]: removed, ...remainingTechSkills } = updatedSkillDefinitions.techSkills;
      updatedSkillDefinitions.techSkills = remainingTechSkills;
    }

    // Update developers to reflect the skill name change
    let updatedDevelopers = currentData.developers;
    if (oldSkillName && oldSkillName !== skillData.name) {
      updatedDevelopers = currentData.developers.map(developer => {
        if (developer.techSkills[oldSkillName] !== undefined) {
          const { [oldSkillName]: oldRating, ...remainingSkills } = developer.techSkills;
          return {
            ...developer,
            techSkills: {
              ...remainingSkills,
              [skillData.name]: oldRating
            }
          };
        }
        return developer;
      });
    }

    const updatedData: TeamData = {
      ...currentData,
      skillDefinitions: updatedSkillDefinitions,
      developers: updatedDevelopers
    };

    this.teamDataService.updateTeamData(updatedData);
  }

  addAppSkill(skillData: SkillFormData, oldSkillName?: string): void {
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

    // If this is an update (oldSkillName provided), remove the old skill name
    if (oldSkillName && oldSkillName !== skillData.name) {
      const { [oldSkillName]: removed, ...remainingAppSkills } = updatedSkillDefinitions.appSkills;
      updatedSkillDefinitions.appSkills = remainingAppSkills;
    }

    // Update developers to reflect the skill name change
    let updatedDevelopers = currentData.developers;
    if (oldSkillName && oldSkillName !== skillData.name) {
      updatedDevelopers = currentData.developers.map(developer => {
        if (developer.appSkills[oldSkillName] !== undefined) {
          const { [oldSkillName]: oldRating, ...remainingSkills } = developer.appSkills;
          return {
            ...developer,
            appSkills: {
              ...remainingSkills,
              [skillData.name]: oldRating
            }
          };
        }
        return developer;
      });
    }

    const updatedData: TeamData = {
      ...currentData,
      skillDefinitions: updatedSkillDefinitions,
      developers: updatedDevelopers
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
