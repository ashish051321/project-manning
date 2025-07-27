import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ManagerListComponent } from './components/managers/manager-list/manager-list.component';
import { ManagerFormComponent } from './components/managers/manager-form/manager-form.component';
import { TeamListComponent } from './components/teams/team-list/team-list.component';
import { TeamFormComponent } from './components/teams/team-form/team-form.component';
import { DeveloperListComponent } from './components/developers/developer-list/developer-list.component';
import { DeveloperFormComponent } from './components/developers/developer-form/developer-form.component';
import { SkillManagementComponent } from './components/skills/skill-management/skill-management.component';
import { VacationCalendarComponent } from './components/vacations/vacation-calendar/vacation-calendar.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'managers', component: ManagerListComponent },
  { path: 'managers/add', component: ManagerFormComponent },
  { path: 'managers/edit/:id', component: ManagerFormComponent },
  { path: 'teams', component: TeamListComponent },
  { path: 'teams/add', component: TeamFormComponent },
  { path: 'teams/edit/:id', component: TeamFormComponent },
  { path: 'developers', component: DeveloperListComponent },
  { path: 'developers/add', component: DeveloperFormComponent },
  { path: 'developers/edit/:id', component: DeveloperFormComponent },
  { path: 'skills', component: SkillManagementComponent },
  { path: 'vacations', component: VacationCalendarComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
