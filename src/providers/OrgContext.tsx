'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type FC,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';

interface OrgContextValue {
  activeOrgId: string | null;
  setActiveOrgId: (id: string | null) => void;
  canSwitchOrg: boolean;
}

const OrgContext = createContext<OrgContextValue>({
  activeOrgId: null,
  setActiveOrgId: () => {},
  canSwitchOrg: false,
});

export const useOrgContext = () => useContext(OrgContext);

export const OrgProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, update } = useSession();
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);

  const isSuperAdmin = session?.user?.isSuperAdmin ?? false;
  const memberships = session?.user?.orgMemberships ?? [];
  const canSwitchOrg = isSuperAdmin || memberships.length > 1;

  useEffect(() => {
    if (!session?.user) return;
    setActiveOrgIdState(session.user.activeOrgId ?? null);
  }, [session?.user?.activeOrgId, session?.user]);

  async function setActiveOrgId(id: string | null) {
    setActiveOrgIdState(id);
    await update({ activeOrgId: id });
  }

  return (
    <OrgContext.Provider value={{ activeOrgId, setActiveOrgId, canSwitchOrg }}>
      {children}
    </OrgContext.Provider>
  );
};
