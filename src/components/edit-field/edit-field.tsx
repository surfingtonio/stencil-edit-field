import { Component, h, Element, Event, EventEmitter, Method, Prop, State } from '@stencil/core';
import { EditFieldOption } from './edit-field-option';

@Component({
  tag: 'edit-field',
  styleUrls: ['edit-field.scss'],
  shadow: true,
})

export class EditField {
  @Element() _host: HTMLElement;
  _form: HTMLFormElement;
  _select: HTMLSelectElement;
  _slot: HTMLSlotElement;
  _value: string;
  _successIcon: HTMLElement;
  _errorIcon: HTMLElement;

  @State() selected: string;

  @Prop() value: string;
  @Prop() action: string;
  @Prop() options: Array<EditFieldOption>;

  @Event({ eventName: 'open' }) openEvent: EventEmitter;
  @Event({ eventName: 'close' }) closeEvent: EventEmitter;
  @Event({ eventName: 'cancel' }) cancelEvent: EventEmitter;
  @Event({ eventName: 'change' }) changeEvent: EventEmitter;
  @Event({ eventName: 'submit' }) submitEvent: EventEmitter<string>;
  @Event({ eventName: 'update' }) updateEvent: EventEmitter<string>;

  @Method()
  async open() {
    this.value = this.value === undefined ? this._value : this.value;
    this.selected = this.selected === undefined ? this.value : this.selected;
    this._select.selectedIndex = this.options.findIndex(option => option.value === this.value);
    
    this.openEvent.emit();
    this._form.style.display = 'block';
  }

  @Method()
  async close() {
    this.closeEvent.emit();
    this._form.style.display = 'none';
  }

  @Method()
  async save() {
    this.submitEvent.emit();

    fetch(`${this.action}/${this.selected}`, { method: 'post' })
    .then(res => {
      if(res.ok) {
        let option = this.options.find(option => option.value === this.selected);
        this._slot.assignedNodes()[0].textContent = option.label;
        this.value = option.value;
        this.updateEvent.emit();
        this.setErrorState(false);
      } else {
        this.setErrorState(true);
      }
    })
    .catch(error => console.error(error));

    this.close();
  }

  componentDidRender() {
    this._slot = this._host.shadowRoot.querySelector('slot');
    if(this._slot.assignedNodes()[0])
      this._value = this._slot.assignedNodes()[0].textContent;
  }

  setErrorState(state) {
    this._successIcon.style.display = !state ? 'inline-block' : 'none';
    this._errorIcon.style.display = state ? 'inline-block' : 'none';
  }

  handleChange = (ev: Event) => {
    let target = ev.target as HTMLSelectElement;
    this.selected = target.value

    if(this.selected !== this.value)
      this.changeEvent.emit(this.selected);
  }

  handleEdit = () => {
    this.open();
  }

  handleSubmit = (ev: Event) => {
    ev.preventDefault();
    this.save();
  }

  handleCancel = () => { 
    this.cancelEvent.emit();
    this.close();
  }

  render() {
    let options = this.options.length === 0 ? null :
      this.options.map((option, i) => (<option key={i} value={option.value} selected={option.value === this.value}>{option.label}</option>));

    return (
      <div class="edit-field">
        <div class="field">
            <slot />
            <i class="fas fa-exclamation-circle fa-fw icon" ref={(el) => this._errorIcon = el as HTMLElement} />
            <i class="fas fa-check-circle fa-fw icon" ref={(el) => this._successIcon = el as HTMLElement} />
            <button type="button" class="btn btn-edit" onClick={() => { this.handleEdit() }}>
                <i class="fas fa-pencil-alt fa-fw" />
            </button>
        </div>
        <form onSubmit={(ev) => { this.handleSubmit(ev) }} ref={(el) => this._form = el as HTMLFormElement}>
            <div class="content">
                <select onChange={(ev) => { this.handleChange(ev) }} ref={(el) => this._select = el as HTMLSelectElement}>
                  {options}
                </select>
                <button type="submit" class="btn btn-submit" disabled={this.selected === this.value}>
                    <i class="fas fa-check fa-fw" />
                </button>
                <button type="button" class="btn btn-cancel" onClick={() => { this.handleCancel() }}>
                    <i class="fas fa-times fa-fw" />
                </button>
                <i class="fas fa-circle-notch fa-fw fa-spin icon" />
            </div>
        </form>
      </div>
    );
  }
}
