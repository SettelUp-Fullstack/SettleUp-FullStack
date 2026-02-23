import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LayoutComponent } from './features/layout/layout.component';
import { GroupsComponent } from './features/groups/groups.component';
import { ExpensesComponent } from './features/expenses/expenses.component';
import { BalancesComponent } from './features/balances/balances.component';
import { SettlementsComponent } from './features/settlements/settlements.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Redirect root to login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Protected routes with Layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'groups', component: GroupsComponent },
      { path: 'expenses', component: ExpensesComponent },
      { path: 'balances', component: BalancesComponent },
      { path: 'settlements', component: SettlementsComponent }
    ]
  },
  
  // Wildcard route
  { path: '**', redirectTo: '/login' }
];
