import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ManagerListComponent } from './components/managers/manager-list/manager-list.component';
import { ManagerFormComponent } from './components/managers/manager-form/manager-form.component';
import { TeamListComponent } from './components/teams/team-list/team-list.component';
import { TeamFormComponent } from './components/teams/team-form/team-form.component';
import { DeveloperListComponent } from './components/developers/developer-list/developer-list.component';
import { DeveloperFormComponent } from './components/developers/developer-form/developer-form.component';
import { SkillManagementComponent } from './components/skills/skill-management/skill-management.component';
import { VacationCalendarComponent } from './components/vacations/vacation-calendar/vacation-calendar.component';
import { SupportAvailabilityComponent } from './components/support-availability/support-availability.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ManagerListComponent,
    ManagerFormComponent,
    TeamListComponent,
    TeamFormComponent,
    DeveloperListComponent,
    DeveloperFormComponent,
    SkillManagementComponent,
    VacationCalendarComponent,
    SupportAvailabilityComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
