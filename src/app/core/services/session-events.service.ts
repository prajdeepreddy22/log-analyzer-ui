import {
  Injectable
} from '@angular/core';

import {
  Subject
} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionEventsService {

  private readonly expiredSubject =
    new Subject<void>();

  readonly expired$ =
    this.expiredSubject.asObservable();

  notifyExpired(): void {

    this.expiredSubject.next();
  }
}
