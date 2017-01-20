import * as React from 'react';
import * as classNames from 'classnames';
import { Icon } from 'react-fa';
import { Table, TableProps, OverlayTrigger, OverlayTriggerProps } from 'react-bootstrap';

import { BaseView, BaseViewProps } from '../../React/BaseView';
import { SearchView, SearchProps } from '../Search/SearchView';
import { PagerView, PagerProps } from '../Pager/PagerView';
import { CommandButton } from '../CommandButton/CommandButton';
import { bindEventToCommand } from '../../React/BindingHelpers';
import { renderConditional } from '../../React/RenderHelpers';
import { DataGridViewModel } from './DataGridViewModel';
import { SortDirection } from '../../../Utils/Compare';
import { BaseListViewTemplate, ListViewRenderTemplate, ListViewRenderTemplateProps } from '../List/ListView';
import { NavButton } from '../List/NavButton';

import './DataGrid.less';

type ColumnRenderFunction = (
  item: any,
  index: number,
  column: DataGridColumnProps,
  columnIndex: number,
  columns: DataGridColumnProps[],
  viewModel: DataGridViewModel<any>,
  view: DataGridView,
) => any;

export interface DataGridColumnProps {
  fieldName?: string;
  header?: string;
  sortable?: boolean;
  className?: string;
  width?: number | string;
  tooltip?: ColumnRenderFunction;
  renderCell?: ColumnRenderFunction;
}

export class DataGridColumn extends React.Component<DataGridColumnProps, any> {
  public static displayName = 'DataGridColumn';

  static defaultProps = {
    fieldName: '',
  };
}

export interface NavDataGridColumnProps extends DataGridColumnProps {
  buttonProps: ColumnRenderFunction;
}

export class NavDataGridColumn extends React.Component<NavDataGridColumnProps, any> {
  public static displayName = 'NavDataGridColumn';

  static defaultProps = {
    fieldName: 'nav',
    header: '',
    className: 'navColumn',
    width: 1,
    renderCell: (item: any, index: number, column: NavDataGridColumnProps, columnIndex: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<any>, view: DataGridView) => {
      const props = renderConditional(column.buttonProps != null, () => column.buttonProps(item, index, column, columnIndex, columns, viewModel, view));

      return (
        <NavButton { ...props } />
      );
    },
  };
}

export interface DataGridViewTemplate<TData> extends ListViewRenderTemplate<TData, DataGridViewModel<TData>, DataGridView> {
}

export class DataGridListViewTemplate<TData> extends BaseListViewTemplate<TData, TData, DataGridViewModel<TData>, DataGridView> implements DataGridViewTemplate<TData> {
  public static displayName = 'DataGridListViewTemplate';

  constructor(
    renderItem?: (item: TData, index: number, viewModel: DataGridViewModel<TData>, view: DataGridView) => any,
    renderItemActions?: (item: TData, index: number, viewModel: DataGridViewModel<TData>, view: DataGridView) => any,
    keySelector?: (item: TData, index: number, viewModel: DataGridViewModel<TData>, view: DataGridView) => any,
    renderTemplateContainer?: (content: any, item: TData, index: number, viewModel: DataGridViewModel<TData>, view: DataGridView) => any,
  ) {
    super(
      renderItem == null ? undefined : (item, data, index, viewModel, view) => renderItem(data, index, viewModel, view),
      renderItemActions == null ? undefined : (item, data, index, viewModel, view) => renderItemActions(data, index, viewModel, view),
      keySelector == null ? undefined : (item, data, index, viewModel, view) => keySelector(data, index, viewModel, view),
      renderTemplateContainer == null ? undefined : (content, item, data, index, viewModel, view) => renderTemplateContainer(content, data, index, viewModel, view),
    );
  }

  getClassName() {
    return 'List';
  }

  getItems(viewModel: DataGridViewModel<TData>, view: DataGridView) {
    return viewModel.projectedItems();
  }

  getItemData(item: TData, index: number, viewModel: DataGridViewModel<TData>, view: DataGridView) {
    return item;
  }
}

export class DataGridTableViewTemplate<T> implements DataGridViewTemplate<T> {
  public static displayName = 'DataGridTableViewTemplate';

  public static renderColumnTooltip(content: any, item: any, index: number, column: DataGridColumnProps, columnIndex: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<any>, view: DataGridView) {
    if (column.tooltip != null) {
      const tooltip = column.tooltip(item, index, column, columnIndex, columns, viewModel, view);

      if (React.isValidElement<OverlayTriggerProps>(tooltip)) {
        if (tooltip.type === OverlayTrigger) {
          return React.cloneElement(tooltip as any, { key: content.key }, content);
        }
        else {
          return (
            <OverlayTrigger key={ content.key } placement={ tooltip.props.placement || 'top' } overlay={ tooltip } >
              { content }
            </OverlayTrigger>
          );
        }
      }
      else {
        return content;
      }
    }
    else {
      return content;
    }
  }

  public static renderDefaultTemplateContainer(content: any, item: any, index: number, column: DataGridColumnProps, columnIndex: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<any>, view: DataGridView) {
    content = (
      <td className={ classNames('DataGrid-cell', column.className) } key={ columnIndex }>
        { content }
      </td>
    );

    return DataGridTableViewTemplate.renderColumnTooltip(content, item, index, column, columnIndex, columns, viewModel, view);
  }

  public static renderDefaultRowContainer(content: any, item: any, index: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<any>, view: DataGridView) {
    const rowClasses = classNames('DataGrid-row', {
      'DataGrid-row--selected': view.props.highlightSelected === true && viewModel.selectedItem() === item,
    });

    const onClick = view.props.selectable !== true ? null : bindEventToCommand(this, viewModel, x => x.selectItem, x => item);

    return (
      <tr className={ rowClasses } key={ (view.props.viewTemplate as DataGridTableViewTemplate<any>).rowKeySelector(item, index, columns, viewModel, view) } onClick={ onClick }>
        { content }
      </tr>
    );
  }

  public static renderDefaultHeaderContainer(content: any, column: DataGridColumnProps, columnIndex: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<any>, view: DataGridView) {
    content = (
      <th key={ columnIndex } className={ classNames('DataGrid-column', column.className) } width={ column.width }>
        { content }
      </th>
    );

    return DataGridTableViewTemplate.renderColumnTooltip(content, null, null, column, columnIndex, columns, viewModel, view);
  }

  private tableProps: TableProps;

  constructor(
    protected renderItem: ColumnRenderFunction = x => x,
    protected rowKeySelector: (item: T, index: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<T>, view: DataGridView) => any = (r, i) => i,
    protected renderTemplateContainer?: (content: any, item: T, index: number, column: DataGridColumnProps, columnIndex: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<T>, view: DataGridView) => any,
    protected renderRowContainer?: (content: any, item: T, index: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<T>, view: DataGridView) => any,
    protected renderHeaderContainer?: (content: any, column: DataGridColumnProps, columnIndex: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<T>, view: DataGridView) => any,
    protected enableAutomaticColumns = true,
    bordered = false, hover = true, striped = false, condensed = true, responsive = true,
  ) {
    this.tableProps = { bordered, hover, striped, condensed, responsive };
    this.renderTemplateContainer = this.renderTemplateContainer || DataGridTableViewTemplate.renderDefaultTemplateContainer;
    this.renderRowContainer = this.renderRowContainer || DataGridTableViewTemplate.renderDefaultRowContainer;
    this.renderHeaderContainer = this.renderHeaderContainer || DataGridTableViewTemplate.renderDefaultHeaderContainer;
  }

  protected getColumnDefinitions(viewModel: DataGridViewModel<T>, view: DataGridView) {
    let children = view.props.children;

    if (this.enableAutomaticColumns === true && React.Children.count(children) === 0) {
      const items = (viewModel.items() || []);

      if (items.length > 0 && items[0] != null) {
        // auto-generate columns
        children = Object
          .keys(items[0])
          .map(x => (
            <DataGridColumn fieldName={ x } />
          )) as any;
      }
    }

    return children;
  }

  protected createColumns(viewModel: DataGridViewModel<T>, view: DataGridView) {
    let columns: DataGridColumnProps[] = null;

    const columnDefinitions = this.getColumnDefinitions(viewModel, view);

    if (React.Children.count(columnDefinitions) > 0) {
      columns = React.Children
        .map(columnDefinitions, x => x)
        .filter(x => x != null)
        .map((x: React.ReactElement<DataGridColumnProps>) => {
          const column = Object.assign<DataGridColumnProps>({}, x.props);

          if (column.header == null) {
            column.header = column.fieldName;
          }

          if (column.renderCell == null) {
            column.renderCell = ((item: any) => item[column.fieldName]);
          }

          return column;
        });
    }

    return columns;
  }

  protected renderEmptyColumns(viewModel: DataGridViewModel<T>, view: DataGridView) {
    return (
      <th key='empty'>
        <div key='columns-empty' className='DataGrid-empty text-muted'>No Columns Defined...</div>
      </th>
    );
  }

  protected renderColumns(columns: DataGridColumnProps[], viewModel: DataGridViewModel<T>, view: DataGridView) {
    return (
      <tr>
        {
          (columns || [])
            .asEnumerable()
            .map((x, i) => this.renderColumnHeader(x, i, columns, viewModel, view))
            .defaultIfEmpty(this.renderEmptyColumns(viewModel, view))
            .toArray()
        }
      </tr>
    );
  }

  protected renderColumnHeader(column: DataGridColumnProps, columnIndex: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<T>, view: DataGridView) {
    const sortIcon = this.renderSortIcon(column, columnIndex, columns, viewModel, view);

    const headerContent = (
      <span className='DataGrid-columnHeader'>
        { column.header }
      </span>
    );

    const header = renderConditional(sortIcon == null, () => (
        <div className='DataGrid-columnContainer'>{ headerContent }</div>
      ), () => (
        <CommandButton className='DataGrid-columnContainer' bsStyle='link' command={ viewModel.toggleSortDirection } commandParameter={ column.fieldName }>
          { headerContent }
          { sortIcon }
        </CommandButton>
      ),
    );

    return this.renderHeaderContainer(header, column, columnIndex, columns, viewModel, view);
  }

  protected renderSortIcon(column: DataGridColumnProps, columnIndex: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<any>, view: DataGridView) {
    let icon: any = null;

    if (viewModel.canSort() && column.sortable) {
      let iconName = '';

      if (viewModel.isSortedBy(column.fieldName, SortDirection.Ascending) === true) {
        iconName = 'sort-asc';
      }
      else if (viewModel.isSortedBy(column.fieldName, SortDirection.Descending) === true) {
        iconName = 'sort-desc';
      }

      return (
        <span className='DataGrid-columnSortIcon'>
          { renderConditional(String.isNullOrEmpty(iconName) === false, () => (<Icon name={ iconName } size='lg' />)) }
        </span>
      );
    }

    return icon;
  }

  protected renderEmptyContent(viewModel: DataGridViewModel<T>, view: DataGridView) {
    return renderConditional(view.props.emptyContent instanceof Function, () => {
      return view.props.emptyContent.apply(this, [ viewModel, view ]);
    }, () => view.props.emptyContent);
  }

  protected renderRows(columns: DataGridColumnProps[], viewModel: DataGridViewModel<T>, view: DataGridView) {
    return (viewModel.projectedItems() || [])
      .asEnumerable()
      .map((x, i) => this.renderRow(x, i, columns, viewModel, view))
      .defaultIfEmpty(
        <tr key='rows-empty'>
          <td colSpan={ (columns || []).length + 1 }>
            <div className='DataGrid-empty text-muted'>
              { this.renderEmptyContent(viewModel, view) }
            </div>
          </td>
        </tr>,
      )
      .toArray();
  }

  protected renderRow(item: T, index: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<T>, view: DataGridView) {
    const rowClasses = classNames('DataGrid-row', {
      'DataGrid-row--selected': view.props.highlightSelected === true && viewModel.selectedItem() === item,
    });

    const onClick = view.props.selectable !== true ? null : bindEventToCommand(this, viewModel, x => x.selectItem, x => item);

    const rowContent = (columns || [])
      .asEnumerable()
      .map((x, i) => this.renderCell(item, index, x, i, columns, viewModel, view))
      .defaultIfEmpty(this.renderEmptyColumns(viewModel, view))
      .toArray();

    return this.renderRowContainer(rowContent, item, index, columns, viewModel, view);
  }

  protected renderCell(item: T, index: number, column: DataGridColumnProps, columnIndex: number, columns: DataGridColumnProps[], viewModel: DataGridViewModel<any>, view: DataGridView) {
    const cellContent = column.renderCell(item, index, column, columnIndex, columns, viewModel, view);

    return this.renderTemplateContainer(cellContent, item, index, column, columnIndex, columns, viewModel, view);
  }

  public initialize(viewModel: DataGridViewModel<T>, view: DataGridView) {
    // do nothing
  }

  public cleanup(viewModel: DataGridViewModel<T>, view: DataGridView) {
    // do nothing
  }

  public render(viewModel: DataGridViewModel<T>, view: DataGridView) {
    const columns = this.createColumns(viewModel, view);

    const props = Object.assign({}, this.tableProps, {
      bordered: view.isOnlyView() === true ? false : this.tableProps.bordered,
    });

    return (
      <Table className='DataGrid-tableView' { ...props }>
        <thead>{ this.renderColumns(columns, viewModel, view) }</thead>
        <tbody>{ this.renderRows(columns, viewModel, view) }</tbody>
      </Table>
    );
  }
}

export interface DataGridComponentProps {
  grid: DataGridViewModel<any>;
  viewTemplate: DataGridViewTemplate<any>;
  fill?: boolean;
}

export interface DataGridSearchProps extends DataGridComponentProps, SearchProps {
}

export class DataGridSearch extends React.Component<DataGridSearchProps, any> {
  render() {
    const { className, props, rest } = this.restProps(x => {
      const { grid, viewTemplate } = x;
      return { grid, viewTemplate };
    });

    return renderConditional(props.grid.canFilter() === true, () => (
      <SearchView { ...rest } viewModel={ props.grid.search }
        className={ classNames('DataGrid', className, { Table: props.viewTemplate instanceof DataGridTableViewTemplate }) }
      />
    ));
  }
}

export interface DataGridPagerProps extends DataGridComponentProps, PagerProps {
}

export class DataGridPager extends React.Component<DataGridPagerProps, any> {
  render() {
    const { className, props, rest } = this.restProps(x => {
      const { grid, viewTemplate } = x;
      return { grid, viewTemplate };
    });

    return (
      <PagerView { ...rest } viewModel={ props.grid.pager }
        className={ classNames('DataGrid', className) }
      />
    );
  }
}

export interface DataGridProps extends ListViewRenderTemplateProps {
  fill?: boolean;
  viewTemplate?: DataGridViewTemplate<any>;
  search?: boolean | SearchProps | any;
  pager?: boolean | PagerProps | any;
  pagerLimits?: number[];
  loadingContent?: any;
  children?: DataGridColumn[];
}

export interface DataGridViewProps extends DataGridProps, BaseViewProps {
  children?: DataGridColumn[];
}

export class DataGridView extends BaseView<DataGridViewProps, DataGridViewModel<any>> {
  public static displayName = 'DataGridView';

  public static Search = DataGridSearch;
  public static Pager = DataGridPager;

  static defaultProps = {
    viewTemplate: new DataGridTableViewTemplate<any>(),
    loadingContent: 'Loading Data...',
    emptyContent: 'No Data...',
  };

  public isOnlyView() {
    return (
      this.props != null &&
      (this.props.search == null || this.props.search === false) &&
      (this.props.pager == null || this.props.pager === false)
    );
  }

  initialize() {
    super.initialize();

    this.props.viewTemplate.initialize(this.state, this);
  }

  updated(prevProps: DataGridViewProps) {
    // if the view was changed then we need to re-init
    if (prevProps.viewTemplate !== this.props.viewTemplate) {
      // cleanup old view
      prevProps.viewTemplate.cleanup(this.state, this);

      // initialize new view
      this.props.viewTemplate.initialize(this.state, this);
    }
  }

  cleanup() {
    super.cleanup();

    this.props.viewTemplate.cleanup(this.state, this);
  }

  updateOn() {
    const watches = [
      this.state.isLoading.changed,
      this.state.projectedItems.changed,
      this.state.hasProjectionError.changed,
    ];

    if (this.props.selectable === true) {
      watches.push(this.state.selectedItem.changed);
    }

    return watches;
  }

  render() {
    const { className, props, rest } = this.restProps(x => {
      const { fill, viewTemplate, search, pager, pagerLimits, selectable, highlightSelected, checkmarkSelected, loadingContent, emptyContent } = x;
      return { fill, viewTemplate, search, pager, pagerLimits, selectable, highlightSelected, checkmarkSelected, loadingContent, emptyContent };
    });

    return this.renderSizedLoadable(this.state.isLoading, props.loadingContent, '1.5em', () => {
      const grid = props.viewTemplate.render(this.state, this);

      return this.renderConditional(
        this.isOnlyView() === true,
        () => React.cloneElement(
          grid,
          Object.assign({ className: classNames('DataGrid', grid.props.className, className) }, rest),
        ),
        () => (
          <div { ...rest } className={ classNames('DataGrid', className) }>
            {
              this.renderConditional(
                props.search !== false,
                () => React.isValidElement(props.search) ? props.search : (
                  <DataGridView.Search { ...(props.search === true ? {} : props.search) } grid={ this.state } viewTemplate={ props.viewTemplate } />
                ),
              )
            }
            { grid }
            {
              this.renderConditional(
                props.pager !== false,
                () => React.isValidElement(props.pager) ? props.pager : (
                  <DataGridView.Pager limits={ props.pagerLimits } { ...(props.pager === true ? {} : props.pager) } grid={ this.state } viewTemplate={ props.viewTemplate } />
                ),
              )
            }
          </div>
        ),
      );
    });
  }
}
