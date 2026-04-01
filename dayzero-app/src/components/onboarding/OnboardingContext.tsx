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
        apiKey: '',
        connected: false,
        storeName: null,
        sellerId: null,
        forwarder: '',
        zipCode: '',
        addressLine1: '',
        addressLine2: '',
        sameAsShipping: true,
        returnZipCode: '',
        returnAddressLine1: '',
        returnAddressLine2: '',
        contact: '',
        marginType: '%',
        marginValue: 30,
        domesticShipping: 0,
        prepCost: 500,
        intlShipping: 0,
        visitedPages: [],
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
