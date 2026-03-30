import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import { RecoveryComponent } from './componentes/recovery/recovery.component';
import { ForbiddenComponent } from './componentes/forbidden/forbidden.component';

export const routes: Routes = [

    { path: "login", component: LoginComponent },
    { path: "home", component: HomeComponent },
    { path: "recovery", component: RecoveryComponent },
    { path: "", redirectTo: "/login", pathMatch: "full" },
    { path: "register", component: RegistroComponent },
    { path: "forbidden", component: ForbiddenComponent},
    { path: "**", redirectTo: "/login" }
];
