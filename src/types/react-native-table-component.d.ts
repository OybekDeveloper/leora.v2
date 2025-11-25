declare module 'react-native-table-component' {
  import { ComponentType } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  export interface TableProps {
    borderStyle?: ViewStyle;
    style?: ViewStyle;
  }

  export interface RowProps {
    data: any[];
    style?: ViewStyle;
    textStyle?: TextStyle;
    widthArr?: number[];
    heightArr?: number[];
    flexArr?: number[];
  }

  export interface RowsProps {
    data: any[][];
    style?: ViewStyle;
    textStyle?: TextStyle;
    widthArr?: number[];
    heightArr?: number[];
    flexArr?: number[];
  }

  export interface CellProps {
    data: any;
    style?: ViewStyle;
    textStyle?: TextStyle;
    width?: number;
    height?: number;
  }

  export const Table: ComponentType<TableProps>;
  export const Row: ComponentType<RowProps>;
  export const Rows: ComponentType<RowsProps>;
  export const Cell: ComponentType<CellProps>;
  export const TableWrapper: ComponentType<any>;
  export const Col: ComponentType<any>;
  export const Cols: ComponentType<any>;
}
