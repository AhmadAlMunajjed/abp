import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { GetFeatures, UpdateFeatures } from '../../actions';
import { FeatureManagement } from '../../models/feature-management';
import { FeatureManagementState } from '../../states';
import { FormGroup, FormControl } from '@angular/forms';
import { pluck, tap } from 'rxjs/operators';

@Component({
  selector: 'abp-feature-management',
  templateUrl: './feature-management.component.html',
})
export class FeatureManagementComponent {
  @Input()
  providerKey: string;

  @Input()
  providerName: string;

  protected _visible;

  @Input()
  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    this._visible = value;
    this.visibleChange.emit(value);

    if (value) this.openModal();
  }

  @Output()
  visibleChange = new EventEmitter<boolean>();

  @Select(FeatureManagementState.getFeatures)
  features$: Observable<FeatureManagement.Feature[]>;

  modalBusy: boolean = false;

  form: FormGroup;

  constructor(private store: Store) {}

  openModal() {
    if (!this.providerKey || !this.providerName) {
      throw new Error('Provider Key and Provider Name are required.');
    }

    this.getFeatures();
  }

  getFeatures() {
    this.store
      .dispatch(new GetFeatures({ providerKey: this.providerKey, providerName: this.providerName }))
      .pipe(pluck('FeatureManagementState', 'features'))
      .subscribe(features => {
        this.buildForm(features);
      });
  }

  buildForm(features) {
    const formGroupObj = {};

    for (let i = 0; i < features.length; i++) {
      formGroupObj[i] = new FormControl(features[i].value === 'false' ? null : features[i].value);
    }

    this.form = new FormGroup(formGroupObj);
  }

  save() {
    this.modalBusy = true;

    let features = this.store.selectSnapshot(FeatureManagementState.getFeatures);

    features = features.map((feature, i) => ({
      name: feature.name,
      value: !this.form.value[i] || this.form.value[i] === 'false' ? null : this.form.value[i],
    }));

    this.store
      .dispatch(
        new UpdateFeatures({
          providerKey: this.providerKey,
          providerName: this.providerName,
          features,
        }),
      )
      .subscribe(() => {
        this.modalBusy = false;
        this.visible = false;
      });
  }
}
