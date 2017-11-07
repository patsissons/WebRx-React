import { Iterable } from 'ix';
import { Observable } from 'rxjs';

import { ObservableOrValue, ObservableLike, IterableLike } from '../../../WebRx';
import { TreeItemListPanelViewModel } from './TreeItemListPanelViewModel';
import { DataGridViewModel, DataSourceRequest, DataSourceResponse } from '../DataGrid/DataGridViewModel';
import { SearchViewModel, SearchRequest } from '../Search/SearchViewModel';

export class AsyncTreeItemListPanelViewModel<T, TRequestContext = any> extends TreeItemListPanelViewModel<T, TRequestContext> {
  public static displayName = 'AsyncTreeItemListPanelViewModel';

  /**
   * @param responseSelector delegate that produces a response from a request.
   * @param itemsSource delegate to produce sub-items from a source item.
   * @param search search handler. if omitted a default search handler will be created. use null for no search handling.
   * @param context request context included in projection requests. if included requests are bound to context events.
   */
  constructor(
    protected readonly responseSelector: (request: DataSourceRequest<TRequestContext> | undefined) => ObservableOrValue<DataSourceResponse<T> | undefined>,
    itemsSource: (item: T) => (IterableLike<T> | undefined),
    search?: SearchViewModel | null,
    context?: ObservableLike<TRequestContext>,
  ) {
    super(itemsSource, x => x, Iterable.empty<T>(), undefined, search, context);
  }

  getResponse(request: DataSourceRequest | undefined) {
    return this.responseSelector(request);
  }
}
