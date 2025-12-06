# FlashList Migration Guide

## Umumiy Qoida

**HECH QACHON** `ScrollView horizontal` yoki `FlatList` ishlatmang.
**HAR DOIM** `@shopify/flash-list` dan `FlashList` ishlating.

## Nima uchun FlashList?

| Xususiyat | ScrollView/FlatList | FlashList |
|-----------|---------------------|-----------|
| Performance | Yomon (barcha itemlar renderlanadi) | Yaxshi (faqat ko'rinadigan itemlar) |
| Memory | Ko'p | Kam |
| Large lists | Lag qiladi | Silliq ishlaydi |
| Recycling | Yo'q | Bor |

---

## 1. Horizontal ScrollView → FlashList

### Muammo

```tsx
// NOTO'G'RI - Ishlatmang!
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {items.map((item) => <ItemCard key={item.id} item={item} />)}
</ScrollView>
```

### Yechim

```tsx
// TO'G'RI - FlashList ishlating
<View style={{ height: 68 }}> {/* MUHIM: aniq height */}
  <FlashList
    horizontal
    showsHorizontalScrollIndicator={false}
    data={items}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <ItemCard item={item} />}
    ListHeaderComponent={<View style={{ width: 20 }} />}
    ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
    ListFooterComponent={<View style={{ width: 20 }} />}
  />
</View>
```

### Muhim Nuanslar

1. **Container height majburiy:**
   ```tsx
   // FlashList horizontal uchun parent height kerak
   <View style={{ height: 68 }}>
     <FlashList horizontal ... />
   </View>
   ```

2. **Item height majburiy:**
   ```tsx
   const styles = StyleSheet.create({
     itemCard: {
       width: 120,
       height: 60,  // MUHIM
     },
   });
   ```

3. **Edge-to-edge pattern** (agar parent padding bo'lsa):
   ```tsx
   // Parent: paddingHorizontal: 20

   // Container: negative margin
   <View style={{ marginHorizontal: -20 }}>
     <FlashList
       horizontal
       ListHeaderComponent={<View style={{ width: 20 }} />}
       ListFooterComponent={<View style={{ width: 20 }} />}
       ...
     />
   </View>
   ```

---

## 2. Vertical FlatList → FlashList

### Muammo

```tsx
// NOTO'G'RI - Ishlatmang!
<FlatList
  data={items}
  renderItem={({ item }) => <ListItem item={item} />}
  keyExtractor={(item) => item.id}
/>
```

### Yechim

```tsx
// TO'G'RI - FlashList ishlating
<FlashList
  data={items}
  renderItem={({ item }) => <ListItem item={item} />}
  keyExtractor={(item) => item.id}
  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
  contentContainerStyle={{ padding: 16 }}
/>
```

### Muhim Farqlar

| FlatList | FlashList |
|----------|-----------|
| `estimatedItemSize` yo'q | Avtomatik (v2.0+) |
| `getItemLayout` kerak | Kerak emas |
| `initialNumToRender` | Kerak emas |

---

## 3. Migration Checklist

### Horizontal list uchun:

- [ ] `ScrollView horizontal` → `FlashList horizontal`
- [ ] `.map()` → `data` + `renderItem`
- [ ] Parent container'ga aniq `height` qo'shish
- [ ] Item'larga aniq `width` va `height` qo'shish
- [ ] `ListHeaderComponent` - boshida spacer
- [ ] `ListFooterComponent` - oxirida spacer
- [ ] `ItemSeparatorComponent` - itemlar orasida gap
- [ ] Agar parent padding bo'lsa - negative margin pattern

### Vertical list uchun:

- [ ] `FlatList` → `FlashList`
- [ ] `keyExtractor` saqlash
- [ ] `ItemSeparatorComponent` qo'shish
- [ ] `ListEmptyComponent` qo'shish (agar kerak bo'lsa)
- [ ] `contentContainerStyle` saqlash

---

## 4. Props Mapping

### FlatList → FlashList

```tsx
// FlatList
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  ItemSeparatorComponent={Separator}
  ListEmptyComponent={Empty}
  ListHeaderComponent={Header}
  ListFooterComponent={Footer}
  contentContainerStyle={styles}
  showsVerticalScrollIndicator={false}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  refreshControl={<RefreshControl ... />}
/>

// FlashList - deyarli bir xil
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  ItemSeparatorComponent={Separator}
  ListEmptyComponent={Empty}
  ListHeaderComponent={Header}
  ListFooterComponent={Footer}
  contentContainerStyle={styles}
  showsVerticalScrollIndicator={false}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  refreshControl={<RefreshControl ... />}
/>
```

### ScrollView horizontal → FlashList horizontal

```tsx
// ScrollView
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
>
  {items.map((item) => <Card key={item.id} {...item} />)}
</ScrollView>

// FlashList
<View style={{ height: 68, marginHorizontal: -20 }}>
  <FlashList
    horizontal
    showsHorizontalScrollIndicator={false}
    data={items}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <Card {...item} />}
    ListHeaderComponent={<View style={{ width: 20 }} />}
    ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
    ListFooterComponent={<View style={{ width: 20 }} />}
  />
</View>
```

---

## 5. Xatoliklar va Yechimlari

### Xato: "FlashList's rendered size is not usable"

**Sabab:** Container'da height yo'q (horizontal uchun) yoki flex: 1 yo'q (vertical uchun)

**Yechim:**
```tsx
// Horizontal
<View style={{ height: 68 }}>
  <FlashList horizontal ... />
</View>

// Vertical
<View style={{ flex: 1 }}>
  <FlashList ... />
</View>
```

### Xato: Itemlar kesilgan ko'rinadi

**Sabab:** Item'larga aniq o'lcham berilmagan

**Yechim:**
```tsx
const styles = StyleSheet.create({
  item: {
    width: 120,  // Horizontal uchun
    height: 60,  // Har doim kerak
  },
});
```

### Xato: Oxirgi item ekran chetiga yopishib qoladi

**Sabab:** ListFooterComponent yo'q

**Yechim:**
```tsx
<FlashList
  ...
  ListFooterComponent={<View style={{ width: 20 }} />}
/>
```

---

## 6. Fayllar Ro'yxati

### Migrated (Tayyor):

#### Horizontal FlashList:
- `app/(modals)/finance/add-account.tsx` - 3 ta horizontal list
- `app/(modals)/finance/debt.tsx` - 3 ta horizontal list
- `app/(modals)/finance/budget-add-value.tsx` - 1 ta horizontal list
- `app/(modals)/menage-widget.tsx` - 2 ta horizontal list (categories, widgets)

#### Vertical FlashList:
- `app/(modals)/menage-widget.tsx` - 1 ta vertical list (main scroll)
- `app/(modals)/notifications.tsx` - 1 ta vertical list
- `app/(modals)/finance-search.tsx` - 1 ta vertical list
- `app/(modals)/search.tsx` - 1 ta vertical list

### Exceptions (O'zgartirish shart emas):
- `src/components/ui/Table.tsx` - Generic UI component, kichik data bilan ishlaydi

---

## 7. Import

```tsx
import { FlashList } from '@shopify/flash-list';
```

Package allaqachon o'rnatilgan: `@shopify/flash-list: 2.0.2`
