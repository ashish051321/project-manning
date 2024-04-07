import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  currentMonth: number = moment().month();
  currentYear: number = moment().year();
  currentMonthName: string = moment().format('MMMM');
  calendar: number[][] = [];

  ngOnInit() {
    this.generateCalendar();
  }

  generateCalendar() {
    const daysInMonth = moment([this.currentYear, this.currentMonth]).daysInMonth();
    const firstDayOfMonth = moment([this.currentYear, this.currentMonth, 1]).day();
    let date = 1;

    for (let i = 0; i < 6; i++) {
      let week: any[] = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDayOfMonth) {
          week.push(null);
        } else if (date > daysInMonth) {
          break;
        } else {
          week.push(date++);
        }
      }
      this.calendar.push(week);
    }
  }

  prevMonth() {
    this.calendar = [];
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.currentMonthName = moment([this.currentYear, this.currentMonth]).format('MMMM');
    this.generateCalendar();
  }

  nextMonth() {
    this.calendar = [];
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.currentMonthName = moment([this.currentYear, this.currentMonth]).format('MMMM');
    this.generateCalendar();
  }
}
