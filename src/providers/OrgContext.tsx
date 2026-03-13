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
}

const OrgContext = createContext<OrgContextValue>({
  activeOrgId: null,
  setActiveOrgId: () => {},
});

export const useOrgContext = () => useContext(OrgContext);

export const OrgProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  // Non-super-admins are locked to their assigned org
  useEffect(() => {
    if (session?.user?.role !== 'super_admin') {
      setActiveOrgId(session?.user?.orgId ?? null);
    }
  }, [session]);

  return (
    <OrgContext.Provider value={{ activeOrgId, setActiveOrgId }}>
      {children}
    </OrgContext.Provider>
  );
};
