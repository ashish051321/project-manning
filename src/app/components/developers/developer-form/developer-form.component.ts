import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TeamDataService } from '../../../services/team-data.service';
import { TeamManagementService } from '../../../services/team-management.service';
import { Developer, Team, DeveloperFormData, TechSkills, AppSkills, VacationDay } from '../../../models/team-models';

@Component({
  selector: 'app-developer-form',
  templateUrl: './developer-form.component.html',
  styleUrls: ['./developer-form.component.scss']
})
export class DeveloperFormComponent implements OnInit, OnDestroy {
  developerForm!: FormGroup;
  teams: Team[] = [];
  availableTeams: Team[] = [];
  loading = true;
  isEditMode = false;
  developerId: string | null = null;
  private dataSubscription: Subscription | null = null;

  // Skill definitions from the data
  techSkillDefinitions: string[] = [];
  appSkillDefinitions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private teamDataService: TeamDataService,
    private teamManagementService: TeamManagementService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // First, get the route parameter
    this.route.paramMap.subscribe(params => {
      this.developerId = params.get('id');
      this.isEditMode = !!this.developerId;
      console.log('Route params loaded. Developer ID:', this.developerId, 'Edit mode:', this.isEditMode);
      
      // Then load the data
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    console.log('Initializing developer form...');
    this.developerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      isSharedResource: [false],
      teamId: [null],
      assignedTeams: [[]],
      techSkills: this.fb.group({}),
      appSkills: this.fb.group({}),
      availability: this.fb.group({
        status: ['active', Validators.required],
        vacationDays: this.fb.array([])
      })
    });
    console.log('Developer form initialized:', this.developerForm);
    console.log('Vacation days array exists:', !!this.developerForm.get('availability.vacationDays'));
  }

  private loadData(): void {
    this.dataSubscription = this.teamDataService.getTeamData().subscribe(data => {
      if (data) {
        console.log('Data loaded:', data);
        this.teams = data.teams;
        this.availableTeams = this.teams;
        
        // Load skill definitions
        this.techSkillDefinitions = Object.keys(data.skillDefinitions.techSkills);
        this.appSkillDefinitions = Object.keys(data.skillDefinitions.appSkills);
        console.log('Skill definitions loaded:', { tech: this.techSkillDefinitions, app: this.appSkillDefinitions });
        
        // Initialize skill form controls
        this.initializeSkillControls();
        
        // If we're in edit mode, load the developer data
        if (this.isEditMode && this.developerId) {
          console.log('Loading developer for edit mode:', this.developerId);
          // Use a longer timeout to ensure form controls are fully initialized
          setTimeout(() => {
            this.loadDeveloperForEdit(this.developerId!);
          }, 100);
        }
      }
      this.loading = false;
    });
  }

  private initializeSkillControls(): void {
    const techSkillsGroup = this.developerForm.get('techSkills') as FormGroup;
    const appSkillsGroup = this.developerForm.get('appSkills') as FormGroup;

    console.log('Initializing skill controls...');
    console.log('Tech skills group:', techSkillsGroup);
    console.log('App skills group:', appSkillsGroup);

    // Clear existing controls first
    Object.keys(techSkillsGroup.controls).forEach(key => {
      techSkillsGroup.removeControl(key);
    });
    Object.keys(appSkillsGroup.controls).forEach(key => {
      appSkillsGroup.removeControl(key);
    });

    // Initialize tech skills
    this.techSkillDefinitions.forEach(skill => {
      techSkillsGroup.addControl(skill, this.fb.control(0));
    });

    // Initialize app skills
    this.appSkillDefinitions.forEach(app => {
      appSkillsGroup.addControl(app, this.fb.control(0));
    });

    console.log('Skill controls initialized. Tech skills:', Object.keys(techSkillsGroup.controls));
    console.log('Skill controls initialized. App skills:', Object.keys(appSkillsGroup.controls));
  }

  private loadDeveloperForEdit(developerId: string): void {
    console.log('Starting to load developer for edit with ID:', developerId);
    const developer = this.teamDataService.getDeveloperById(developerId);
    if (developer) {
      console.log('Loading developer for edit:', developer);
      
      try {
        // Set basic form values
        const basicValues = {
          name: developer.name,
          isSharedResource: developer.isSharedResource,
          teamId: developer.teamId,
          assignedTeams: developer.assignedTeams || [],
          availability: {
            status: developer.availability.status
          }
        };
        console.log('Setting basic form values:', basicValues);
        this.developerForm.patchValue(basicValues);

        // Set skill values using patchValue for the entire skills object
        const skillValues = {
          techSkills: developer.techSkills,
          appSkills: developer.appSkills
        };
        console.log('Setting skill values:', skillValues);
        this.developerForm.patchValue(skillValues);

        // Load vacation days
        console.log('Loading vacation days:', developer.availability.vacationDays);
        this.loadVacationDays(developer.availability.vacationDays);
        
        console.log('Form values after loading:', this.developerForm.value);
        console.log('Form is valid:', this.developerForm.valid);
        console.log('Form is dirty:', this.developerForm.dirty);
      } catch (error) {
        console.error('Error loading developer data:', error);
      }
    } else {
      console.error('Developer not found with ID:', developerId);
    }
  }

  private loadVacationDays(vacationDays: VacationDay[]): void {
    try {
      const vacationArray = this.developerForm.get('availability.vacationDays') as FormArray;
      if (vacationArray) {
        vacationArray.clear();
        
        vacationDays.forEach(vacation => {
          vacationArray.push(this.fb.group({
            type: [vacation.type, Validators.required],
            date: [vacation.date || ''],
            startDate: [vacation.startDate || ''],
            endDate: [vacation.endDate || ''],
            description: [vacation.description, Validators.required]
          }));
        });
        console.log('Vacation days loaded successfully:', vacationDays.length, 'days');
      } else {
        console.error('Vacation array not found in form');
      }
    } catch (error) {
      console.error('Error loading vacation days:', error);
    }
  }

  onSubmit(): void {
    if (this.developerForm.valid) {
      const formData: DeveloperFormData = {
        name: this.developerForm.value.name,
        teamId: this.developerForm.value.teamId,
        isSharedResource: this.developerForm.value.isSharedResource,
        assignedTeams: this.developerForm.value.assignedTeams || [],
        techSkills: this.developerForm.value.techSkills,
        appSkills: this.developerForm.value.appSkills,
        availability: {
          status: this.developerForm.value.availability.status,
          vacationDays: this.developerForm.value.availability.vacationDays
        }
      };
      
      if (this.isEditMode && this.developerId) {
        this.teamManagementService.updateDeveloper(this.developerId, formData);
      } else {
        this.teamManagementService.addDeveloper(formData);
      }
      
      this.router.navigate(['/developers']);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/developers']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.developerForm.controls).forEach(key => {
      const control = this.developerForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(nestedKey => {
          control.get(nestedKey)?.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Team assignment methods
  getAvailableTeams(): Team[] {
    const selectedTeamId = this.developerForm.get('teamId')?.value;
    const selectedAssignedTeams = this.developerForm.get('assignedTeams')?.value || [];
    
    return this.teams.filter(team => {
      if (this.developerForm.get('isSharedResource')?.value) {
        // For shared resources, show teams not already assigned
        return !selectedAssignedTeams.includes(team.id);
      } else {
        // For primary team members, show teams not already assigned to other developers
        return team.id !== selectedTeamId;
      }
    });
  }

  addTeam(teamId: string): void {
    if (this.developerForm.get('isSharedResource')?.value) {
      const currentAssignedTeams = this.developerForm.get('assignedTeams')?.value || [];
      if (!currentAssignedTeams.includes(teamId)) {
        this.developerForm.patchValue({
          assignedTeams: [...currentAssignedTeams, teamId]
        });
      }
    } else {
      this.developerForm.patchValue({ teamId });
    }
  }

  removeTeam(teamId: string): void {
    if (this.developerForm.get('isSharedResource')?.value) {
      const currentAssignedTeams = this.developerForm.get('assignedTeams')?.value || [];
      this.developerForm.patchValue({
        assignedTeams: currentAssignedTeams.filter((id: string) => id !== teamId)
      });
    } else {
      this.developerForm.patchValue({ teamId: null });
    }
  }

  getSelectedTeams(): Team[] {
    if (this.developerForm.get('isSharedResource')?.value) {
      const assignedTeamIds = this.developerForm.get('assignedTeams')?.value || [];
      return this.teams.filter(team => assignedTeamIds.includes(team.id));
    } else {
      const teamId = this.developerForm.get('teamId')?.value;
      if (teamId) {
        const team = this.teams.find(t => t.id === teamId);
        return team ? [team] : [];
      }
      return [];
    }
  }

  // Vacation management methods
  get vacationDaysArray(): FormArray {
    try {
      const vacationArray = this.developerForm.get('availability.vacationDays') as FormArray;
      if (!vacationArray) {
        console.error('Vacation array not found in form');
        // Return an empty FormArray as fallback
        return new FormArray([]);
      }
      return vacationArray;
    } catch (error) {
      console.error('Error accessing vacation array:', error);
      // Return an empty FormArray as fallback
      return new FormArray([]);
    }
  }

  addVacationDay(): void {
    try {
      const vacationArray = this.vacationDaysArray;
      if (vacationArray) {
        vacationArray.push(this.fb.group({
          type: ['single', Validators.required],
          date: [''],
          startDate: [''],
          endDate: [''],
          description: ['', Validators.required]
        }));
        console.log('Vacation day added successfully');
      } else {
        console.error('Vacation array not available');
      }
    } catch (error) {
      console.error('Error adding vacation day:', error);
    }
  }

  removeVacationDay(index: number): void {
    try {
      const vacationArray = this.vacationDaysArray;
      if (vacationArray && vacationArray.length > index) {
        vacationArray.removeAt(index);
        console.log('Vacation day removed successfully');
      } else {
        console.error('Vacation array not available or index out of bounds');
      }
    } catch (error) {
      console.error('Error removing vacation day:', error);
    }
  }

  // Form validation methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.developerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isNestedFieldInvalid(parentField: string, childField: string): boolean {
    const field = this.developerForm.get(`${parentField}.${childField}`);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.developerForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  // Helper methods
  getTeamName(teamId: string): string {
    const team = this.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  }

  getSkillCount(): number {
    const techSkills = this.developerForm.get('techSkills')?.value || {};
    return Object.values(techSkills).filter((rating: any) => rating && rating > 0).length;
  }

  getAppCount(): number {
    const appSkills = this.developerForm.get('appSkills')?.value || {};
    return Object.values(appSkills).filter((rating: any) => rating && rating > 0).length;
  }

  getVacationCount(): number {
    try {
      if (this.developerForm && this.developerForm.get('availability.vacationDays')) {
        const vacationArray = this.vacationDaysArray;
        let totalDays = 0;
        
        for (let i = 0; i < vacationArray.length; i++) {
          const vacation = vacationArray.at(i);
          if (vacation) {
            const type = vacation.get('type')?.value;
            if (type === 'single') {
              const date = vacation.get('date')?.value;
              if (date) {
                const vacationDate = new Date(date);
                const dayOfWeek = vacationDate.getDay();
                // Only count if it's not Saturday (6) or Sunday (0)
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                  totalDays += 1;
                }
              }
            } else if (type === 'range') {
              const startDate = vacation.get('startDate')?.value;
              const endDate = vacation.get('endDate')?.value;
              
              if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                // Set time to midnight to ensure accurate day comparison
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                
                // Iterate through each day in the range
                const current = new Date(start);
                while (current <= end) {
                  const dayOfWeek = current.getDay();
                  // Only count if it's not Saturday (6) or Sunday (0)
                  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    totalDays += 1;
                  }
                  current.setDate(current.getDate() + 1);
                }
              }
            }
          }
        }
        
        return totalDays;
      }
      return 0;
    } catch (error) {
      console.error('Error getting vacation count:', error);
      return 0;
    }
  }

  getVacationEntriesCount(): number {
    try {
      if (this.developerForm && this.developerForm.get('availability.vacationDays')) {
        return this.vacationDaysArray.length;
      }
      return 0;
    } catch (error) {
      console.error('Error getting vacation entries count:', error);
      return 0;
    }
  }

  onDeveloperTypeChange(): void {
    const isSharedResource = this.developerForm.get('isSharedResource')?.value;
    if (isSharedResource) {
      // Clear primary team assignment
      this.developerForm.patchValue({ teamId: null });
    } else {
      // Clear shared team assignments
      this.developerForm.patchValue({ assignedTeams: [] });
    }
  }
}
