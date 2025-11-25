import 'react-native-get-random-values';
import { createRealmContext } from '@realm/react';
import { realmConfig } from '@/database/realmConfig';

// Создаем контекст
export const RealmContext = createRealmContext(realmConfig);

// Экспортируем хуки для использования
export const { 
  RealmProvider, 
  useRealm, 
  useObject, 
  useQuery 
} = RealmContext;
