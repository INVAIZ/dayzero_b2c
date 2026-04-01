import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type ForwarderValue = 'qx' | 'rincos' | 'kse' | 'enterround' | 'hanjin' | 'other' | '';

interface OnboardingState {
    apiKey: string;
    connected: boolean;
    storeName: string | null;
    sellerId: string | null;

    // Step 2 basic info
    forwarder: ForwarderValue;
    zipCode: string;
    addressLine1: string;
    addressLine2: string;
    sameAsShipping: boolean;
    returnZipCode: string;
    returnAddressLine1: string;
    returnAddressLine2: string;
    contact: string;

    // Step 3 margin/costs
    marginType: "%" | "원";
    marginValue: number;
    domesticShipping: number;
    prepCost: number;
    intlShipping: number;

    // 방문 기록
    visitedPages: string[];
}

interface OnboardingContextProps {
    state: OnboardingState;
    setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
}

const OnboardingContext = createContext<OnboardingContextProps | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<OnboardingState>({
        apiKey: 'DZ-a1b2c3d4e5f6',
        connected: true,
        storeName: 'DayZero Store',
        sellerId: 'DAYZERO_JP',
        forwarder: 'qx',
        zipCode: '273-0012',
        addressLine1: '千葉県船橋市浜町2-5-7',
        addressLine2: 'MFLP船橋1-3階 Qxpress',
        sameAsShipping: true,
        returnZipCode: '',
        returnAddressLine1: '',
        returnAddressLine2: '',
        contact: '010-1234-5678',
        marginType: '%',
        marginValue: 30,
        domesticShipping: 0,
        prepCost: 500,
        intlShipping: 0,
        visitedPages: ['qoo10-connect', 'basic-info', 'basic-margin'],
    });

    return (
        <OnboardingContext.Provider value={{ state, setState }}>
            {children}
        </OnboardingContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
