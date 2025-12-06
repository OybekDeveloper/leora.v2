# Horizontal FlashList Pattern - Edge-to-Edge Carousel

## Muammo

React Native'da horizontal FlashList/FlatList container padding ichida ishlatilganda, itemlar ekran chetlarigacha yetmaydi va kesilgan ko'rinadi.

```
Muammoli holat:
┌──────────────────────────────────┐
│ ←20px→ ┌──────────────┐ ←20px→   │  ← Screen
│        │  FlashList   │          │
│        │  (kesilgan)  │          │
│        └──────────────┘          │
└──────────────────────────────────┘
```

## Sabab

Parent container'ga `paddingHorizontal: 20` berilgan. FlashList bu container ichida joylashgan va u **container width minus padding** ga teng bo'ladi. Natijada FlashList scroll content'i ekran chegaralarigacha yetmaydi.

## Yechim: "Negative Margin + Spacer" Pattern

```
To'g'ri holat:
┌──────────────────────────────────┐
│┌────────────────────────────────┐│
││←spacer→ [items...] ←spacer→    ││  ← FlashList full width
│└────────────────────────────────┘│
└──────────────────────────────────┘
```

### 1-Qadam: Styles yaratish

```tsx
const styles = StyleSheet.create({
  // Parent container - paddingdan chiqarish uchun negative margin
  formGroupFullWidth: {
    marginBottom: 4,
    marginHorizontal: -20,  // Parent padding'ni bekor qiladi
  },

  // Label uchun padding qaytarish
  labelWithPadding: {
    paddingHorizontal: 20,
  },

  // List boshi va oxiri uchun spacer (padding o'rniga)
  listEdgeSpacer: {
    width: 20,  // Parent padding bilan bir xil
  },

  // Itemlar orasidagi gap
  horizontalSeparator: {
    width: 8,
  },

  // Footer ichida button bo'lsa (masalan "Add" tugmasi)
  listFooterWithButton: {
    flexDirection: 'row',
    paddingLeft: 8,   // Separator o'rniga
    paddingRight: 20, // Oxirgi edge spacer
  },

  // FlashList container - MUHIM: aniq height kerak
  horizontalListContainer: {
    height: 68,  // Item height + vertical padding
  },
});
```

### 2-Qadam: Component strukturasi

```tsx
{/* Full-width container */}
<View style={styles.formGroupFullWidth}>

  {/* Label - padding bilan */}
  <Text style={[styles.label, styles.labelWithPadding]}>
    Category
  </Text>

  {/* FlashList container - aniq height bilan */}
  <View style={styles.horizontalListContainer}>
    <FlashList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ItemCard item={item} />}

      {/* MUHIM: Boshida spacer */}
      ListHeaderComponent={<View style={styles.listEdgeSpacer} />}

      {/* Itemlar orasida gap */}
      ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}

      {/* MUHIM: Oxirida spacer */}
      ListFooterComponent={<View style={styles.listEdgeSpacer} />}
    />
  </View>
</View>
```

### 3-Qadam: Footer ichida button bo'lsa

Agar oxirida "Add" yoki boshqa tugma bo'lsa:

```tsx
ListFooterComponent={
  <View style={styles.listFooterWithButton}>
    <View style={styles.itemCard}>
      <Pressable onPress={onAddPress}>
        <Text>+ Add New</Text>
      </Pressable>
    </View>
  </View>
}
```

## Muhim Qoidalar

### 1. FlashList uchun aniq height

Horizontal FlashList **majburiy ravishda** aniq height talab qiladi:

```tsx
// NOTO'G'RI - height yo'q
<FlashList horizontal data={items} />

// TO'G'RI - container'da height bor
<View style={{ height: 68 }}>
  <FlashList horizontal data={items} />
</View>
```

### 2. Item'larga ham height

```tsx
const styles = StyleSheet.create({
  itemCard: {
    width: 120,
    height: 60,  // MUHIM
  },
  itemPressable: {
    width: '100%',
    height: '100%',  // Parent height'ni oladi
  },
});
```

### 3. Spacer va Separator farqi

| Component | Vazifasi | Qachon ishlatiladi |
|-----------|----------|-------------------|
| `ListHeaderComponent` | Birinchi item oldidan spacer | Har doim |
| `ListFooterComponent` | Oxirgi item keyingi spacer | Har doim |
| `ItemSeparatorComponent` | Itemlar orasida gap | Har doim |

### 4. Negative Margin formula

```
marginHorizontal = -1 * parentPaddingHorizontal
listEdgeSpacer.width = parentPaddingHorizontal
```

## Platform farqlari

Bu pattern iOS va Android'da bir xil ishlaydi. Boshqa alternativlar:

| Yondashuv | iOS | Android | Tavsiya |
|-----------|-----|---------|---------|
| Negative margin + spacer | ✅ | ✅ | **Eng yaxshi** |
| contentContainerStyle padding | ❌ | ❌ | Ishlamaydi |
| contentInset (iOS only) | ✅ | ❌ | Faqat iOS |
| Fake spacer items | ✅ | ✅ | Murakkab |

## Checklist

Horizontal FlashList qo'shganda:

- [ ] Parent container'ga `marginHorizontal: -20` qo'shildi
- [ ] Label'ga `paddingHorizontal: 20` qo'shildi
- [ ] FlashList container'ga aniq `height` berildi
- [ ] `ListHeaderComponent` - boshida spacer
- [ ] `ListFooterComponent` - oxirida spacer (yoki button + spacer)
- [ ] `ItemSeparatorComponent` - itemlar orasida gap
- [ ] Item'larga aniq `width` va `height` berildi

## Amaliy misol

Fayl: `app/(modals)/finance/add-account.tsx`

Bu faylda Type va Currency selektorlari ushbu pattern bilan implement qilingan.
