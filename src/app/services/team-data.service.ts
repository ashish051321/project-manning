import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { TeamData, Manager, Team, Developer, SkillDefinitions } from '../models/team-models';

@Injectable({
  providedIn: 'root'
})
export class TeamDataService {
  private dataUrl = 'assets/team_manage_master.json';
  private teamDataSubject = new BehaviorSubject<TeamData | null>(null);
  public teamData$ = this.teamDataSubject.asObservable();
  private readonly STORAGE_KEY = 'projectManningTeamData';

  constructor(private http: HttpClient) {
    this.initializeData();
  }

  private initializeData(): void {
    // First try to load from localStorage
    const storedData = this.loadFromLocalStorage();
    
    if (storedData && this.isValidTeamData(storedData)) {
      // Use stored data if available and valid
      console.log('Using data from localStorage');
      this.teamDataSubject.next(storedData);
    } else {
      // Create empty structure instead of loading sample data
      console.log('Creating empty data structure - no sample data loaded');
      this.createEmptyDataStructure();
    }
  }

  private createEmptyDataStructure(): void {
    const emptyData: TeamData = {
      organization: {
        name: 'ProjectManning Organization',
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0]
      },
      managers: [],
      teams: [],
      developers: [],
      skillDefinitions: {
        techSkills: {},
        appSkills: {}
      },
      metadata: {
        skillScales: {
          techSkillsScale: '0-10',
          appSkillsScale: '0-10'
        },
        defaultTechSkillRating: 7,
        defaultAppSkillRating: 8,
        sharedResourceIndicator: 'isSharedResource',
        vacationTracking: true
      }
    };
    
    // Save empty structure to localStorage
    this.saveToLocalStorage(emptyData);
    
    // Update the subject with empty data
    this.teamDataSubject.next(emptyData);
    
    console.log('Empty data structure created and saved to localStorage');
  }

  private isValidTeamData(data: any): boolean {
    // Basic validation to ensure the data structure is correct
    return data && 
           typeof data === 'object' &&
           data.organization &&
           Array.isArray(data.managers) &&
           Array.isArray(data.teams) &&
           Array.isArray(data.developers) &&
           data.skillDefinitions &&
           data.metadata;
  }

  private loadFromJsonFile(): void {
    this.http.get<TeamData>(this.dataUrl)
      .pipe(
        catchError(error => {
          console.error('Error loading team data from JSON:', error);
          return of(this.getDefaultTeamData());
        })
      )
      .subscribe(data => {
        // Save to localStorage and update subject
        this.saveToLocalStorage(data);
        this.teamDataSubject.next(data);
      });
  }

  private getDefaultTeamData(): TeamData {
    return {
      organization: {
        name: 'ProjectManning Organization',
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0]
      },
      managers: [],
      teams: [],
      developers: [],
      skillDefinitions: {
        techSkills: {},
        appSkills: {}
      },
      metadata: {
        skillScales: {
          techSkillsScale: '0-10',
          appSkillsScale: '0-10'
        },
        defaultTechSkillRating: 7,
        defaultAppSkillRating: 8,
        sharedResourceIndicator: 'isSharedResource',
        vacationTracking: true
      }
    };
  }

  getTeamData(): Observable<TeamData | null> {
    return this.teamData$;
  }

  getCurrentTeamData(): TeamData | null {
    return this.teamDataSubject.value;
  }

  updateTeamData(updatedData: TeamData): void {
    // Update lastUpdated timestamp
    updatedData.organization.lastUpdated = new Date().toISOString().split('T')[0];
    
    // Save to localStorage first
    this.saveToLocalStorage(updatedData);
    
    // Then update the subject
    this.teamDataSubject.next(updatedData);
  }

  private saveToLocalStorage(data: TeamData): void {
    try {
      // Test if localStorage is available
      if (!this.isLocalStorageAvailable()) {
        console.warn('localStorage is not available');
        return;
      }
      
      const jsonData = JSON.stringify(data);
      localStorage.setItem(this.STORAGE_KEY, jsonData);
      console.log('Data saved to localStorage successfully');
      console.log('Saved data size:', new Blob([jsonData]).size, 'bytes');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      // If localStorage is full or disabled, try to clear some space
      this.handleLocalStorageError();
    }
  }

  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  private handleLocalStorageError(): void {
    try {
      // Try to clear old data and save again
      localStorage.removeItem(this.STORAGE_KEY);
      const currentData = this.teamDataSubject.value;
      if (currentData) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(currentData));
      }
    } catch (error) {
      console.error('Failed to handle localStorage error:', error);
    }
  }

  loadFromLocalStorage(): TeamData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        console.log('Data loaded from localStorage successfully');
        console.log('localStorage data size:', new Blob([stored]).size, 'bytes');
        return parsedData;
      } else {
        console.log('No data found in localStorage');
        return null;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      console.log('localStorage content:', localStorage.getItem(this.STORAGE_KEY));
      return null;
    }
  }

  // Method to reset data to initial JSON state
  resetToInitialData(): void {
    console.log('Resetting to initial data from JSON file');
    this.loadFromJsonFile();
  }

  // Method to force reload from localStorage (for debugging)
  forceReloadFromLocalStorage(): void {
    console.log('Force reloading from localStorage');
    const storedData = this.loadFromLocalStorage();
    if (storedData && this.isValidTeamData(storedData)) {
      this.teamDataSubject.next(storedData);
      console.log('Successfully reloaded from localStorage');
    } else {
      console.log('No valid data in localStorage, loading from JSON file');
      this.loadFromJsonFile();
    }
  }

  // Method to clear all data
  clearAllData(): void {
    try {
      // Remove from localStorage
      localStorage.removeItem(this.STORAGE_KEY);
      
      // Create and save empty data structure
      this.createEmptyDataStructure();
      
      console.log('All data cleared - localStorage now contains empty structure');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  // Method to export data
  exportData(): string {
    const currentData = this.getCurrentTeamData();
    return currentData ? JSON.stringify(currentData, null, 2) : '';
  }

  // Method to import data
  importData(jsonData: string): boolean {
    try {
      const parsedData = JSON.parse(jsonData);
      this.updateTeamData(parsedData);
      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Helper methods for getting specific data
  getManagers(): Manager[] {
    const data = this.getCurrentTeamData();
    return data?.managers || [];
  }

  getTeams(): Team[] {
    const data = this.getCurrentTeamData();
    return data?.teams || [];
  }

  getDevelopers(): Developer[] {
    const data = this.getCurrentTeamData();
    return data?.developers || [];
  }

  getSkillDefinitions(): SkillDefinitions {
    const data = this.getCurrentTeamData();
    return data?.skillDefinitions || { techSkills: {}, appSkills: {} };
  }

  // Get specific entities by ID
  getManagerById(id: string): Manager | undefined {
    return this.getManagers().find(manager => manager.id === id);
  }

  getTeamById(id: string): Team | undefined {
    return this.getTeams().find(team => team.id === id);
  }

  getDeveloperById(id: string): Developer | undefined {
    const developers = this.getDevelopers();
    console.log('Looking for developer with ID:', id);
    console.log('Available developers:', developers);
    const developer = developers.find(developer => developer.id === id);
    console.log('Found developer:', developer);
    return developer;
  }

  // Get related data
  getTeamsByManagerId(managerId: string): Team[] {
    return this.getTeams().filter(team => team.managerId === managerId);
  }

  getDevelopersByTeamId(teamId: string): Developer[] {
    return this.getDevelopers().filter(developer => 
      developer.teamId === teamId || 
      (developer.isSharedResource && developer.assignedTeams?.includes(teamId))
    );
  }

  getSharedResources(): Developer[] {
    return this.getDevelopers().filter(developer => developer.isSharedResource);
  }

  // Check if data exists in localStorage
  hasStoredData(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  // Get data size in localStorage
  getDataSize(): number {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? new Blob([data]).size : 0;
    } catch (error) {
      return 0;
    }
  }
}
