import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store';

export default function Index() {
  const authed = useAppSelector((state) => state.auth.authed);
  const guest = useAppSelector((state) => state.auth.guest);

  if (authed || guest) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(screens)/welcome" />;
}
