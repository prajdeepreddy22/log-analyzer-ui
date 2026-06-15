import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService:
    jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService =
      jasmine.createSpyObj<AuthService>(
        'AuthService',
        ['register']
      );

    authService.register.and.returnValue(
      of({
        token: 'jwt-token'
      })
    );

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authService
        }
      ]
    }).compileComponents();

    fixture =
      TestBed.createComponent(
        RegisterComponent
      );

    component =
      fixture.componentInstance;
  });

  it('requires a .com or .in email address', () => {
    populateValidForm();
    component.email.set('user@example.org');

    component.onSubmit();

    expect(component.emailInvalid())
      .toBeTrue();

    expect(authService.register)
      .not.toHaveBeenCalled();
  });

  it('requires uppercase, lowercase, and special password characters', () => {
    populateValidForm();
    component.password.set('password1');
    component.confirmPassword.set(
      'password1'
    );

    component.onSubmit();

    expect(component.passwordInvalid())
      .toBeTrue();

    expect(authService.register)
      .not.toHaveBeenCalled();
  });

  it('submits a valid registration form', () => {
    populateValidForm();

    component.onSubmit();

    expect(authService.register)
      .toHaveBeenCalledWith({
        displayName: 'Test User',
        username: 'testuser',
        email: 'user@example.com',
        password: 'Password!'
      });
  });

  function populateValidForm(): void {
    component.displayName.set('Test User');
    component.username.set('testuser');
    component.email.set('user@example.com');
    component.password.set('Password!');
    component.confirmPassword.set(
      'Password!'
    );
  }
});
