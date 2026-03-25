import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { LoginComponent } from './componentes/login/login.component';

export const routes: Routes = [

    {path: "login", component: LoginComponent},
    {path: "home", component: HomeComponent},
    {path: "", redirectTo: "/login", pathMatch: "full"}
];
