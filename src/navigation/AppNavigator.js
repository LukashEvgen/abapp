import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';

import {colors} from '../utils/theme';

import LoginScreen from '../screens/shared/LoginScreen';

import ClientDashboard from '../screens/client/ClientDashboard';
import MyCases from '../screens/client/MyCases';
import CaseDetail from '../screens/client/CaseDetail';
import MyDocuments from '../screens/client/MyDocuments';
import ScannerScreen from '../screens/client/ScannerScreen';
import MyInvoices from '../screens/client/MyInvoices';
import MyInspections from '../screens/client/MyInspections';
import InspectionDetail from '../screens/client/InspectionDetail';
import RegistrySearch from '../screens/client/RegistrySearch';
import ChatScreen from '../screens/shared/ChatScreen';
import BureauScreen from '../screens/client/BureauScreen';

import AdminDashboard from '../screens/admin/AdminDashboard';
import ClientsList from '../screens/admin/ClientsList';
import AdminClientDetail from '../screens/admin/AdminClientDetail';
import AdminCaseDetail from '../screens/admin/AdminCaseDetail';
import CreateInvoice from '../screens/admin/CreateInvoice';
import AdminChat from '../screens/admin/AdminChat';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {backgroundColor: colors.bg, borderTopColor: colors.border},
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
      }}>
      <Tab.Screen
        name="Home"
        component={ClientDashboard}
        options={{tabBarLabel: 'Головна'}}
      />
      <Tab.Screen
        name="Cases"
        component={ClientCasesStack}
        options={{tabBarLabel: 'Справи'}}
      />
      <Tab.Screen
        name="Inspections"
        component={ClientInspectionsStack}
        options={{tabBarLabel: 'Перевірки'}}
      />
      <Tab.Screen
        name="Registry"
        component={RegistrySearch}
        options={{tabBarLabel: 'Реєстри'}}
      />
      <Tab.Screen
        name="Bureau"
        component={BureauStack}
        options={{tabBarLabel: 'Бюро'}}
      />
    </Tab.Navigator>
  );
}

function ClientCasesStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="MyCases" component={MyCases} />
      <Stack.Screen name="CaseDetail" component={CaseDetail} />
      <Stack.Screen name="MyDocuments" component={MyDocuments} />
      <Stack.Screen name="ScannerScreen" component={ScannerScreen} />
      <Stack.Screen name="MyInvoices" component={MyInvoices} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function ClientInspectionsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="MyInspections" component={MyInspections} />
      <Stack.Screen name="InspectionDetail" component={InspectionDetail} />
    </Stack.Navigator>
  );
}

function BureauStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Bureau" component={BureauScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function AdminChatsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="ClientsList" component={ClientsList} />
      <Stack.Screen name="AdminChatDetail" component={AdminChat} />
    </Stack.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {backgroundColor: colors.bg, borderTopColor: colors.border},
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
      }}>
      <Tab.Screen
        name="AdminHome"
        component={AdminDashboard}
        options={{tabBarLabel: 'Головна'}}
      />
      <Tab.Screen
        name="Clients"
        component={AdminClientsStack}
        options={{tabBarLabel: 'Клієнти'}}
      />
      <Tab.Screen
        name="AdminChats"
        component={AdminChatsStack}
        options={{tabBarLabel: 'Чати'}}
      />
    </Tab.Navigator>
  );
}

function AdminClientsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="ClientsList" component={ClientsList} />
      <Stack.Screen name="AdminClientDetail" component={AdminClientDetail} />
      <Stack.Screen name="AdminCaseDetail" component={AdminCaseDetail} />
      <Stack.Screen name="CreateInvoice" component={CreateInvoice} />
      <Stack.Screen name="AdminChatDetail" component={ChatScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const {user, initializing, isLawyer} = useAuth();

  if (initializing) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : isLawyer ? (
          <Stack.Screen name="AdminRoot" component={AdminTabs} />
        ) : (
          <Stack.Screen name="ClientRoot" component={ClientTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
