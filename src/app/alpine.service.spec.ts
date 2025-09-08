import { TestBed } from '@angular/core/testing';

import { AlpineService } from './alpine.service';

describe('AlpineService', () => {
  let service: AlpineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlpineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
