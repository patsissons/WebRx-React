import { Observable, IDisposable } from 'rx';

import { property, command, whenAny, getObservable } from '../../WebRx';
import { Logging, Alert, SubMan } from '../../Utils';
import { Manager } from '../../Routing/RouteManager';

export interface LifecycleComponentViewModel {
  initializeViewModel(): void;
  loadedViewModel(): void;
  cleanupViewModel(): void;
}

export function isViewModel(source: any): source is BaseViewModel {
  const viewModel = <BaseViewModel>source;

  if (viewModel != null && viewModel.isViewModel instanceof Function) {
    return viewModel.isViewModel();
  }
  else {
    return false;
  }
}

export abstract class BaseViewModel implements IDisposable {
  public static displayName = 'BaseViewModel';

  private viewModelLogger = Logging.getLogger(this.getDisplayName());
  private isLoggingMemberObservables = false;

  protected subs = new SubMan();
  public stateChanged = command();

  // these are WebRx helper functions (so you don't need to import them every time)
  protected property = property;
  protected command = command;
  protected getObservable = getObservable;
  protected whenAny = whenAny;

  // -----------------------------------------
  // These are special methods that handle the
  // lifecycle internally (do not override!!!)
  // -----------------------------------------
  // tslint:disable:no-unused-variable
  private initializeViewModel() {
    this.initialize();

    if (this.logger.level <= Logging.LogLevel.Debug && this.isLoggingMemberObservables === false) {
      this.isLoggingMemberObservables = true;

      this.logMemberObservables();
    }
  }

  private loadedViewModel() {
    this.loaded();
  }

  private updatedViewModel() {
    this.updated();
  }

  private cleanupViewModel() {
    this.cleanup();
  }
  // tslint:enable:no-unused-variable
  // -----------------------------------------

  protected initialize() {
    // do nothing by default
  }

  protected loaded() {
    // do nothing by default
  }

  protected updated() {
    // do nothing by default
  }

  protected cleanup() {
    // do nothing by default
  }

  protected get logger() {
    return this.viewModelLogger;
  }

  public isViewModel() {
    return true;
  }

  public dispose() {
    this.subs.dispose();
  }

  public getDisplayName() { return Object.getName(this); }

  public createAlert(content: any, header?: string, style?: string, timeout?: number) {
    Alert.create(content, header, style, timeout);
  }

  public alertForError<TError>(error: TError, header?: string, style?: string, timeout?: number, formatter?: (e: TError) => string) {
    Alert.createForError(error, header, style, timeout, formatter);
  }

  public getObservableOrAlert<T, TError>(
    observableFactory: () => Observable<T>,
    header?: string,
    style?: string,
    timeout?: number,
    errorFormatter?: (e: TError) => string,
  ) {

    return Observable
      .defer(observableFactory)
      .catch(err => {
        this.alertForError(err, header, style, timeout, errorFormatter);

        return Observable.empty<T>();
      });
  }

  public getObservableResultOrAlert<TResult, TError>(
    resultFactory: () => TResult,
    header?: string,
    style?: string,
    timeout?: number,
    errorFormatter?: (e: TError) => string,
  ) {

    const observableFactory = () => Observable.of<TResult>(resultFactory.call(this));

    return this.getObservableOrAlert(observableFactory, header, style, timeout, errorFormatter);
  }

  public notifyChanged(...args: any[]) {
    this.stateChanged.execute(args);
  }

  private logMemberObservables() {
    let obj: { [key: string]: any } = this;
    let keys = Object.keys(obj);
    for (let i = 0; i < keys.length; ++i) {
      let member = obj[keys[i]];

      if (member != null) {
        let prop: { changed: Observable<any> } = member;
        let cmd: { results: Observable<any> } = member;

        if (prop.changed != null && prop.changed.subscribe instanceof Function) {
          this.logObservable(prop.changed, keys[i]);
        }
        else if (cmd.results != null && cmd.results.subscribe instanceof Function) {
          this.logObservable(cmd.results, `<${keys[i]}>`);
        }
      }
    }
  }

  protected logObservable(observable: Observable<any>, name: string) {
    this.subscribe(observable.subscribe(x => {
      if (x instanceof Object) {
        let value = Object.getName(x);

        if (value === 'Object') {
          value = '';
        }

        this.logger.debug(`${name} = ${value}`, x);
      }
      else {
        this.logger.debug(`${name} = ${x}`);
      }
    }));
  }

  protected subscribeOrAlert<T, TError>(
    observableFactory: () => Observable<T>,
    header: string,
    onNext: (value: T) => void,
    style?: string,
    timeout?: number,
    errorFormatter?: (e: TError) => string) {

    return this.subscribe(
      this.getObservableOrAlert(
        observableFactory,
        header,
        style,
        timeout,
        errorFormatter,
      ).subscribe(x => {
        try {
          onNext(x);
        }
        catch (err) {
          this.alertForError(err, header, style, timeout, errorFormatter);
        }
      }),
    );
  }

  protected subscribe(subscription: IDisposable) {
    this.subs.add(subscription);
    return subscription;
  }

  protected navTo(path: string, state?: any, replace = false, uriEncode = false) {
    Manager.navTo(path, state, replace, uriEncode);
  }

  public bindObservable<T>(observable: Observable<T>, subscriptionSelector: (x: Observable<T>) => IDisposable) {
    return this.subscribe(subscriptionSelector(observable));
  }
}
