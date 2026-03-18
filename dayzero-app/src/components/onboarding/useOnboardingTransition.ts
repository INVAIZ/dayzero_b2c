import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TRANSITION_DURATION = 300;

export function useOnboardingTransition() {
    const navigate = useNavigate();
    const [exiting, setExiting] = useState(false);

    const transitionTo = (path: string) => {
        setExiting(true);
        setTimeout(() => navigate(path), TRANSITION_DURATION);
    };

    return { exiting, transitionTo };
}
