// src/components/ui/Table.tsx
import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ScrollView,
  Animated,
} from 'react-native';
import { useAppTheme } from '@/constants/theme';

export interface TableColumn<T> {
  key: string;
  title: string;
  width?: number;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
  renderText?: (item: T, index: number) => string;
  style?: TextStyle;
  headerStyle?: TextStyle;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowPress?: (item: T, index: number) => void;
  showHeader?: boolean;
  headerBackgroundColor?: string;
  rowBackgroundColor?: string;
  alternateRowColor?: boolean;
  borderColor?: string;
  headerTextStyle?: TextStyle;
  rowTextStyle?: TextStyle;
  containerStyle?: ViewStyle;
  headerContainerStyle?: ViewStyle;
  rowContainerStyle?: ViewStyle;
  keyExtractor?: (item: T, index: number) => string;
  scrollable?: boolean;
}

// Animated Row Component
interface AnimatedRowProps {
  index: number;
  RowWrapper: any;
  rowProps: any;
  containerStyle: any;
  rowsData: any[][];
  columnStyles: { width?: number; flex?: number }[];
  rowStyle: any;
  renderCell: (cellData: any, colIndex: number, isHeader: boolean) => React.ReactNode;
  showSeparator: boolean;
  separatorColor: string;
}

const AnimatedRow: React.FC<AnimatedRowProps> = ({
  index,
  RowWrapper,
  rowProps,
  containerStyle,
  rowsData,
  columnStyles,
  rowStyle,
  renderCell,
  showSeparator,
  separatorColor,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50, // Stagger animation
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <RowWrapper {...rowProps}>
        <View style={containerStyle}>
          <View style={rowStyle}>
            {rowsData[index].map((cellData, colIndex) => (
              <View
                key={`cell-${index}-${colIndex}`}
                style={{
                  ...columnStyles[colIndex],
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                }}
              >
                {renderCell(cellData, colIndex, false)}
              </View>
            ))}
          </View>
        </View>
        {showSeparator && (
          <View style={{ height: 1, backgroundColor: separatorColor }} />
        )}
      </RowWrapper>
    </Animated.View>
  );
};

export function Table<T>({
  data,
  columns,
  onRowPress,
  showHeader = true,
  headerBackgroundColor,
  rowBackgroundColor,
  alternateRowColor = false,
  borderColor,
  headerTextStyle,
  rowTextStyle,
  containerStyle,
  headerContainerStyle,
  rowContainerStyle,
  keyExtractor,
  scrollable = false,
}: TableProps<T>) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  // Animation setup
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const defaultHeaderBg = headerBackgroundColor || theme.colors.border;
  const defaultRowBg = rowBackgroundColor || theme.colors.card;
  const defaultBorderColor = borderColor || theme.colors.border;

  // Calculate column styles - use flex or fixed width
  const columnStyles = columns.map((col) => {
    if (col.width) {
      return { width: col.width };
    }
    if (col.flex) {
      return { flex: col.flex };
    }
    return { flex: 1 }; // default flex
  });

  // Prepare header data
  const headerData = columns.map((col) => col.title);

  // Prepare row data
  const rowsData = data.map((item, rowIndex) => {
    return columns.map((col) => {
      if (col.render) {
        return col.render(item, rowIndex);
      }
      if (col.renderText) {
        return col.renderText(item, rowIndex);
      }
      return String((item as any)[col.key] ?? '');
    });
  });

  // Cell renderer with alignment
  const renderCell = (cellData: any, colIndex: number, isHeader: boolean = false) => {
    const column = columns[colIndex];
    const align = column?.align || 'left';

    const cellStyle: ViewStyle = {
      flex: 1,
      justifyContent: 'center',
      alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
      paddingHorizontal: 8,
    };

    const textStyle: TextStyle = {
      textAlign: align,
    };

    if (isHeader) {
      return (
        <View style={cellStyle}>
          <Text
            style={[
              styles.headerText,
              textStyle,
              column?.headerStyle,
              headerTextStyle,
            ]}
          >
            {cellData}
          </Text>
        </View>
      );
    }

    return (
      <View style={cellStyle}>
        {typeof cellData === 'string' ? (
          <Text
            style={[
              styles.cellText,
              textStyle,
              column?.style,
              rowTextStyle,
            ]}
          >
            {cellData}
          </Text>
        ) : (
          cellData
        )}
      </View>
    );
  };

  const mergedContainerStyle = {
    ...styles.container,
    ...(containerStyle || {}),
  };

  const mergedHeaderContainerStyle = {
    ...styles.headerContainer,
    backgroundColor: defaultHeaderBg,
    ...(headerContainerStyle || {}),
  };

  const TableContent = (
    <Animated.View
      style={[
        mergedContainerStyle,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header */}
      {showHeader && (
        <View style={mergedHeaderContainerStyle}>
          <View style={styles.header}>
            {headerData.map((item, index) => {
              const column = columns[index];
              const align = column?.align || 'left';
              const colStyle = columnStyles[index];

              return (
                <View
                  key={`header-${index}`}
                  style={{
                    ...colStyle,
                    justifyContent: 'center',
                    alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
                    paddingHorizontal: 16,
                  }}
                >
                  <Text
                    style={[
                      styles.headerText,
                      { textAlign: align },
                      column?.headerStyle,
                      headerTextStyle,
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Rows */}
      <View style={styles.dataWrapper}>
        {data.map((item, index) => {
          const rowBg = alternateRowColor && index % 2 === 1
            ? theme.colors.surfaceElevated
            : defaultRowBg;

          const RowWrapper = onRowPress ? TouchableOpacity : View;
          const rowProps = onRowPress
            ? {
              onPress: () => onRowPress(item, index),
              activeOpacity: 0.7,
            }
            : {};

          const rowStyle = {
            ...styles.row,
            backgroundColor: rowBg,
          };

          const containerStyle = {
            backgroundColor: rowBg,
            ...(rowContainerStyle || {}),
          };

          return (
            <AnimatedRow
              key={keyExtractor ? keyExtractor(item, index) : index}
              index={index}
              RowWrapper={RowWrapper}
              rowProps={rowProps}
              containerStyle={containerStyle}
              rowsData={rowsData}
              columnStyles={columnStyles}
              rowStyle={rowStyle}
              renderCell={renderCell}
              showSeparator={index < data.length - 1}
              separatorColor={defaultBorderColor}
            />
          );
        })}
      </View>
    </Animated.View>
  );

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {TableContent}
      </ScrollView>
    );
  }

  return TableContent;
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    headerContainer: {
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      height: 44,
      alignItems: 'center',
    },
    headerText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dataWrapper: {
      backgroundColor: "transparent",
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },
    row: {
      flexDirection: 'row',
      minHeight: 50,
      alignItems: 'center',
    },
    cellText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    separator: {
      height: 1,
    },
  });
