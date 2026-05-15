import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiButtonComponent } from '../../../shared/components';

interface PlanRow {
  id: string;
  name: string;
  billing: 'Monthly' | 'Yearly';
  price: number;
  creditsPerMonth: number;
  active: boolean;
}

interface CreditPackRow {
  id: string;
  name: string;
  price: number;
  credits: number;
  availableFor: string;
}

interface CreditActionRow {
  id: string;
  action: string;
  credits: number;
  notes: string;
}

interface RuleRow {
  id: string;
  key: string;
  value: string;
  scope: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  selectedPlanTab: 'monthly' | 'yearly' = 'monthly';

  monthlyPlans: PlanRow[] = [
    { id: 'starter', name: 'Starter (1st Month)', billing: 'Monthly', price: 199, creditsPerMonth: 100, active: true },
    { id: 'standard-m', name: 'Standard', billing: 'Monthly', price: 1650, creditsPerMonth: 100, active: true },
    { id: 'basic-pro-m', name: 'Basic Pro', billing: 'Monthly', price: 3000, creditsPerMonth: 275, active: true },
    { id: 'growth-m', name: 'Growth', billing: 'Monthly', price: 7000, creditsPerMonth: 550, active: true },
    { id: 'scale-m', name: 'Scale', billing: 'Monthly', price: 15000, creditsPerMonth: 1150, active: true },
    { id: 'enterprise-m', name: 'Enterprise', billing: 'Monthly', price: 35000, creditsPerMonth: 3000, active: true },
  ];

  yearlyPlans: PlanRow[] = [
    { id: 'standard-y', name: 'Standard', billing: 'Yearly', price: 18349, creditsPerMonth: 100, active: true },
    { id: 'basic-pro-y', name: 'Basic Pro', billing: 'Yearly', price: 33199, creditsPerMonth: 275, active: true },
    { id: 'growth-y', name: 'Growth', billing: 'Yearly', price: 77199, creditsPerMonth: 550, active: true },
    { id: 'scale-y', name: 'Scale', billing: 'Yearly', price: 165199, creditsPerMonth: 1150, active: true },
    { id: 'enterprise-y', name: 'Enterprise', billing: 'Yearly', price: 385199, creditsPerMonth: 3000, active: true },
  ];

  creditPacks: CreditPackRow[] = [
    { id: 'small', name: 'Small Credit Pack', price: 1650, credits: 100, availableFor: 'All Users' },
    { id: 'medium', name: 'Medium Credit Pack', price: 4125, credits: 250, availableFor: 'All Users' },
    { id: 'large', name: 'Large Credit Pack', price: 8250, credits: 500, availableFor: 'All Users' },
  ];

  creditActions: CreditActionRow[] = [
    { id: 'first-project', action: 'First Project (Onboarding)', credits: 25, notes: 'Discounted first project charge' },
    { id: 'new-project', action: 'New Project Generation', credits: 100, notes: 'Standard full project cost' },
    { id: 'template', action: 'Template Variation', credits: 80, notes: 'New variation generation' },
    { id: 'small-edit', action: 'Small Edit (Text/UI)', credits: 20, notes: 'Minor tweak requests' },
    { id: 'medium-edit', action: 'Medium Edit', credits: 40, notes: 'Moderate change set' },
    { id: 'large-edit', action: 'Large Edit / Page Change', credits: 80, notes: 'Complex UI or logic changes' },
    { id: 'build-fix', action: 'Build Fix', credits: 10, notes: 'Build repair task' },
    { id: 'ai-min', action: 'AI Chat Minimum', credits: 2, notes: 'Minimum per interaction' },
  ];

  rules: RuleRow[] = [
    { id: 'signup-credit', key: 'Credits On Signup', value: '50', scope: 'Free Plan' },
    { id: 'topup-global', key: 'Top-Up Access', value: 'Allowed for all users', scope: 'Global' },
    { id: 'credit-rate', key: '1 Credit Price', value: '\u20B916.50', scope: 'Billing' },
    { id: 'ai-formula', key: 'AI Credit Formula', value: '(Input Tokens + Output Tokens) / 1000', scope: 'AI Chat' },
    { id: 'renewal', key: 'Auto Renewal', value: 'Enabled for subscriptions', scope: 'Subscription' },
  ];

  planForm: PlanRow = this.newPlan('Monthly');
  editingPlanId = '';

  packForm: CreditPackRow = this.newPack();
  editingPackId = '';

  actionForm: CreditActionRow = this.newAction();
  editingActionId = '';

  ruleForm: RuleRow = this.newRule();
  editingRuleId = '';

  get activePlans(): PlanRow[] {
    return this.selectedPlanTab === 'monthly' ? this.monthlyPlans : this.yearlyPlans;
  }

  private newPlan(billing: 'Monthly' | 'Yearly'): PlanRow {
    return { id: '', name: '', billing, price: 0, creditsPerMonth: 0, active: true };
  }

  private newPack(): CreditPackRow {
    return { id: '', name: '', price: 0, credits: 0, availableFor: 'All Users' };
  }

  private newAction(): CreditActionRow {
    return { id: '', action: '', credits: 0, notes: '' };
  }

  private newRule(): RuleRow {
    return { id: '', key: '', value: '', scope: '' };
  }

  selectPlanTab(tab: 'monthly' | 'yearly'): void {
    this.selectedPlanTab = tab;
    this.cancelPlanEdit();
  }

  savePlan(): void {
    const target = this.selectedPlanTab === 'monthly' ? this.monthlyPlans : this.yearlyPlans;
    if (!this.planForm.name.trim()) {
      return;
    }

    if (this.editingPlanId) {
      const idx = target.findIndex((item) => item.id === this.editingPlanId);
      if (idx >= 0) {
        target[idx] = { ...this.planForm, id: this.editingPlanId };
      }
    } else {
      target.unshift({ ...this.planForm, id: this.generateId(this.planForm.name) });
    }

    this.cancelPlanEdit();
  }

  editPlan(item: PlanRow): void {
    this.editingPlanId = item.id;
    this.planForm = { ...item };
  }

  deletePlan(id: string): void {
    if (this.selectedPlanTab === 'monthly') {
      this.monthlyPlans = this.monthlyPlans.filter((item) => item.id !== id);
    } else {
      this.yearlyPlans = this.yearlyPlans.filter((item) => item.id !== id);
    }
    if (this.editingPlanId === id) {
      this.cancelPlanEdit();
    }
  }

  cancelPlanEdit(): void {
    this.editingPlanId = '';
    this.planForm = this.newPlan(this.selectedPlanTab === 'monthly' ? 'Monthly' : 'Yearly');
  }

  savePack(): void {
    if (!this.packForm.name.trim()) {
      return;
    }

    if (this.editingPackId) {
      const idx = this.creditPacks.findIndex((item) => item.id === this.editingPackId);
      if (idx >= 0) {
        this.creditPacks[idx] = { ...this.packForm, id: this.editingPackId };
      }
    } else {
      this.creditPacks.unshift({ ...this.packForm, id: this.generateId(this.packForm.name) });
    }

    this.cancelPackEdit();
  }

  editPack(item: CreditPackRow): void {
    this.editingPackId = item.id;
    this.packForm = { ...item };
  }

  deletePack(id: string): void {
    this.creditPacks = this.creditPacks.filter((item) => item.id !== id);
    if (this.editingPackId === id) {
      this.cancelPackEdit();
    }
  }

  cancelPackEdit(): void {
    this.editingPackId = '';
    this.packForm = this.newPack();
  }

  saveAction(): void {
    if (!this.actionForm.action.trim()) {
      return;
    }

    if (this.editingActionId) {
      const idx = this.creditActions.findIndex((item) => item.id === this.editingActionId);
      if (idx >= 0) {
        this.creditActions[idx] = { ...this.actionForm, id: this.editingActionId };
      }
    } else {
      this.creditActions.unshift({ ...this.actionForm, id: this.generateId(this.actionForm.action) });
    }

    this.cancelActionEdit();
  }

  editAction(item: CreditActionRow): void {
    this.editingActionId = item.id;
    this.actionForm = { ...item };
  }

  deleteAction(id: string): void {
    this.creditActions = this.creditActions.filter((item) => item.id !== id);
    if (this.editingActionId === id) {
      this.cancelActionEdit();
    }
  }

  cancelActionEdit(): void {
    this.editingActionId = '';
    this.actionForm = this.newAction();
  }

  saveRule(): void {
    if (!this.ruleForm.key.trim()) {
      return;
    }

    if (this.editingRuleId) {
      const idx = this.rules.findIndex((item) => item.id === this.editingRuleId);
      if (idx >= 0) {
        this.rules[idx] = { ...this.ruleForm, id: this.editingRuleId };
      }
    } else {
      this.rules.unshift({ ...this.ruleForm, id: this.generateId(this.ruleForm.key) });
    }

    this.cancelRuleEdit();
  }

  editRule(item: RuleRow): void {
    this.editingRuleId = item.id;
    this.ruleForm = { ...item };
  }

  deleteRule(id: string): void {
    this.rules = this.rules.filter((item) => item.id !== id);
    if (this.editingRuleId === id) {
      this.cancelRuleEdit();
    }
  }

  cancelRuleEdit(): void {
    this.editingRuleId = '';
    this.ruleForm = this.newRule();
  }

  private generateId(value: string): string {
    return `${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
  }
}
