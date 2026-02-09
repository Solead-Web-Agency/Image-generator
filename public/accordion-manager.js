// Gestion de l'accordéon global progressif

class AccordionManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.completedSteps = [];
        
        this.init();
    }

    init() {
        // Réinitialisation complète au chargement
        this.resetAllSteps();
        
        // Attacher les event listeners aux headers
        document.querySelectorAll('.step-header').forEach(header => {
            header.addEventListener('click', () => {
                const stepNum = parseInt(header.dataset.step);
                this.toggleStep(stepNum);
            });
        });

        // Ouvrir la première étape par défaut
        this.openStep(1);
    }
    
    resetAllSteps() {
        console.log('🔄 [ACCORDION] Réinitialisation complète au chargement');
        
        // Nettoyer toutes les étapes
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = document.getElementById(`globalStep${i}`);
            if (!step) continue;
            
            // Retirer toutes les classes
            step.classList.remove('active', 'completed');
            
            // Forcer display: none pour toutes les étapes sauf la 1
            if (i > 1) {
                step.style.display = 'none';
            } else {
                step.style.display = 'block';
            }
        }
        
        // Réinitialiser l'état
        this.completedSteps = [];
        this.currentStep = 1;
    }

    toggleStep(stepNumber) {
        const step = document.getElementById(`globalStep${stepNumber}`);
        if (!step) return;

        const isActive = step.classList.contains('active');
        
        if (!isActive) {
            this.openStep(stepNumber);
        } else {
            step.classList.remove('active');
        }
    }

    openStep(stepNumber) {
        console.log(`🔄 Ouverture de l'étape globale ${stepNumber}`);
        
        // Fermer toutes les étapes
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = document.getElementById(`globalStep${i}`);
            if (!step) continue;
            
            if (i === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active');
            }
        }
        
        // Marquer les étapes précédentes comme complétées
        for (let i = 1; i < stepNumber; i++) {
            const prevStep = document.getElementById(`globalStep${i}`);
            if (prevStep && !this.completedSteps.includes(i)) {
                prevStep.classList.add('completed');
            }
        }
        
        this.currentStep = stepNumber;
        
        // Scroll smooth vers l'étape
        setTimeout(() => {
            const targetStep = document.getElementById(`globalStep${stepNumber}`);
            if (targetStep) {
                targetStep.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 150);
    }

    completeStep(stepNumber) {
        console.log(`✅ [ACCORDION] completeStep(${stepNumber}) called`);
        console.log(`📊 [ACCORDION] Current completedSteps:`, this.completedSteps);
        
        if (!this.completedSteps.includes(stepNumber)) {
            this.completedSteps.push(stepNumber);
            console.log(`✅ [ACCORDION] Added ${stepNumber} to completedSteps`);
        }
        
        const step = document.getElementById(`globalStep${stepNumber}`);
        console.log(`🔍 [ACCORDION] Step element found:`, !!step);
        
        if (step) {
            step.classList.add('completed');
            step.classList.remove('active');
            console.log(`✅ [ACCORDION] Step ${stepNumber} marked as completed`);
        }
        
        // Ouvrir automatiquement l'étape suivante
        if (stepNumber < this.totalSteps) {
            console.log(`⏰ [ACCORDION] Scheduling openStep(${stepNumber + 1}) in 500ms...`);
            setTimeout(() => {
                console.log(`🚀 [ACCORDION] Now calling openStep(${stepNumber + 1})`);
                this.openStep(stepNumber + 1);
            }, 500);
        } else {
            console.log(`🏁 [ACCORDION] This was the last step (${stepNumber}/${this.totalSteps})`);
        }
    }

    updateStep3Content(mode) {
        const step3Title = document.getElementById('step3Title');
        const step3Desc = document.getElementById('step3Desc');
        const step3Icon = document.getElementById('step3Icon');

        switch(mode) {
            case 'manual':
                step3Title.textContent = 'Sujet de l\'image';
                step3Desc.textContent = 'Décrivez ce que vous souhaitez voir';
                step3Icon.textContent = '📝';
                break;
            case 'scan':
                step3Title.textContent = 'Scanner la page';
                step3Desc.textContent = 'Analysez une page web pour générer des images';
                step3Icon.textContent = '🔍';
                break;
            case 'csv':
                step3Title.textContent = 'Import CSV';
                step3Desc.textContent = 'Chargez votre fichier CSV';
                step3Icon.textContent = '📊';
                break;
        }
    }

    isStepCompleted(stepNumber) {
        return this.completedSteps.includes(stepNumber);
    }

    resetFromStep(stepNumber) {
        console.log(`🔄 Reset depuis l'étape ${stepNumber}`);
        
        // Retirer le statut "completed" des étapes à partir de stepNumber
        this.completedSteps = this.completedSteps.filter(s => s < stepNumber);
        
        for (let i = stepNumber; i <= this.totalSteps; i++) {
            const step = document.getElementById(`globalStep${i}`);
            if (step) {
                step.classList.remove('completed');
                step.classList.remove('active');
            }
        }
        
        this.openStep(stepNumber);
    }
}

// Instance globale
const accordionManager = new AccordionManager();
