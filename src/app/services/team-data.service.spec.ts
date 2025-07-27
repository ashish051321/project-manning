import { TestBed } from '@angular/core/testing';

import { TeamDataService } from './team-data.service';

describe('TeamDataService', () => {
  let service: TeamDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeamDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
