import React from 'react';

import { Redirect } from 'expo-router';

import { ROUTES } from '@/config/constants';

export default function IndexRoute(): React.JSX.Element {
  return <Redirect href={ROUTES.adminHome} />;
}
