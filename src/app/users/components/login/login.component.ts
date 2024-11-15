import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
} from '@angular/forms';
import { LoginService } from '../../services/login.service';
import { catchError, of, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { SessionService } from '../../services/session.service';
import { MainContainerComponent, ToastService } from 'ngx-dabd-grupo01';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MainContainerComponent, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  userId!: number;

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private userService: UserService,
    private sessionService: SessionService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loginService
        .login(this.loginForm.value)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 400) {
              this.toastService.sendError("La contraseña o el email son invalidos, por favor vuelva a intentar");
            } else {
              console.log('An unexpected error occurred:', error);
              this.toastService.sendError("Ha sucedido un error inesperado, por favor vuelva a intentar mas tarde.");
            }
            return of(null);
          }),
          switchMap((id: number | null) => {
            if (id) {
              this.userId = id;
              return this.userService.getUserById2(id);
            }
            return of(null);
          }),
          catchError((error: HttpErrorResponse) => {
            console.log('Error fetching user details:', error);
            this.toastService.sendError("Error al recuperar los datos del usuario, por favor vuelva a intentar mas tarde.")
            return of(null);
          })
        )
        .subscribe((user) => {
          if (user) {
            this.sessionService.setItem('user', user, 1440); // 1440 = 24 hs.
          }
        });
    }
  }
}
