import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useStudents } from './hooks/useStudents';
import { useClientPortal } from './hooks/useClientPortal';
import { LoginScreen } from './components/LoginScreen';
import {
  TrainerLayout,
  type TrainerNavTab,
} from './components/TrainerLayout';
import { TrainerDashboard } from './components/TrainerDashboard';
import { AccessManager } from './components/AccessManager';
import { StudentModal } from './components/StudentModal';
import { StudentProfile } from './components/StudentProfile';
import { AssessmentForm } from './components/AssessmentForm';
import { CardViewer } from './components/CardViewer';
import { ClientPortal } from './components/ClientPortal';
import { TrainerKeyGate } from './components/TrainerKeyGate';
import type { Avaliacao } from './types/database';

type TrainerView =
  | { screen: 'tab'; tab: TrainerNavTab }
  | { screen: 'profile'; studentId: string }
  | { screen: 'assessment-form'; studentId: string; editing?: Avaliacao | null }
  | { screen: 'card'; studentId: string; assessmentId?: string }
  | { screen: 'client-preview'; studentId: string };

export function App() {
  const {
    user,
    isDemoMode,
    isTrainerAuthorized,
    checkingTrainerAuth,
    loading: authLoading,
    authError,
    keyError,
    signInWithGoogle,
    enterDemoMode,
    activateTrainerKey,
    signOut,
  } = useAuth();

  const {
    students,
    loading: studentsLoading,
    error: studentsError,
    refresh,
    createStudent,
    updateStudent,
    deleteStudent,
    toggleClientAccess,
    regenerateClientAccess,
    createAssessment,
    updateAssessment,
    deleteAssessment,
  } = useStudents(isTrainerAuthorized ? user?.id : undefined, isDemoMode);

  const {
    clientStudent,
    loading: clientLoading,
    error: clientError,
    loginAsClient,
    refreshClient,
    logoutClient,
  } = useClientPortal();

  const [view, setView] = useState<TrainerView>({
    screen: 'tab',
    tab: 'overview',
  });
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeStudent = useMemo(() => {
    if (view.screen === 'tab') return null;
    return students.find((s) => s.id === view.studentId) ?? null;
  }, [students, view]);

  // 1. Se o visitante entrou como ALUNO (via link ?aluno=... ou código de acesso)
  if (!user && clientLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 text-[#FC4C02]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium text-neutral-400">
          Carregando seu portal de evolução...
        </p>
      </div>
    );
  }

  if (!user && clientStudent) {
    return (
      <ClientPortal
        student={clientStudent}
        onExit={logoutClient}
        onRefresh={refreshClient}
      />
    );
  }

  // 2. Loading da sessão do Treinador
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 text-[#FC4C02]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium text-neutral-400">
          Carregando Medidas &amp; Metas...
        </p>
      </div>
    );
  }

  // 3. Tela de entrada (Treinador Google OAuth / Demo OR Aluno via Código)
  if (!user) {
    return (
      <LoginScreen
        onSignInGoogle={signInWithGoogle}
        onEnterDemoTrainer={enterDemoMode}
        onLoginClient={loginAsClient}
        trainerError={authError}
        clientError={clientError}
      />
    );
  }

  // 3.5. Verificação da 2ª camada de segurança do Treinador (Chave Bcrypt + RLS)
  if (checkingTrainerAuth) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 text-[#FC4C02]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium text-neutral-400">
          Verificando credenciais do treinador...
        </p>
      </div>
    );
  }

  if (!isTrainerAuthorized) {
    return (
      <TrainerKeyGate
        user={user}
        isDemoMode={isDemoMode}
        error={keyError}
        onActivate={activateTrainerKey}
        onSignOut={signOut}
      />
    );
  }

  // 4. Preview instantâneo do Portal do Aluno a partir do Painel do Treinador
  if (view.screen === 'client-preview' && activeStudent) {
    return (
      <ClientPortal
        student={activeStudent}
        isTrainerPreview
        onExit={() =>
          setView({ screen: 'profile', studentId: activeStudent.id })
        }
      />
    );
  }

  const activeTab: TrainerNavTab =
    view.screen === 'tab' ? view.tab : 'students';

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const renderContent = () => {
    if (view.screen === 'profile' && activeStudent) {
      return (
        <StudentProfile
          student={activeStudent}
          onBack={() => setView({ screen: 'tab', tab: 'students' })}
          onNewAssessment={() =>
            setView({
              screen: 'assessment-form',
              studentId: activeStudent.id,
              editing: null,
            })
          }
          onEditAssessment={(avaliacao) =>
            setView({
              screen: 'assessment-form',
              studentId: activeStudent.id,
              editing: avaliacao,
            })
          }
          onViewCard={(assessmentId) =>
            setView({
              screen: 'card',
              studentId: activeStudent.id,
              assessmentId,
            })
          }
          onPreviewAsClient={() =>
            setView({ screen: 'client-preview', studentId: activeStudent.id })
          }
          onUpdateStudent={async (id, payload) => {
            await updateStudent(id, payload);
          }}
          onToggleClientAccess={toggleClientAccess}
          onDeleteStudent={async (id) => {
            await deleteStudent(id);
            setView({ screen: 'tab', tab: 'students' });
          }}
          onDeleteAssessment={deleteAssessment}
        />
      );
    }

    if (view.screen === 'assessment-form' && activeStudent) {
      return (
        <AssessmentForm
          student={activeStudent}
          editingAssessment={view.editing}
          onBack={() =>
            setView({ screen: 'profile', studentId: activeStudent.id })
          }
          onSaveNew={async (payload) => {
            const saved = await createAssessment(
              payload,
              activeStudent.altura_cm,
            );
            setView({
              screen: 'card',
              studentId: activeStudent.id,
              assessmentId: saved.id,
            });
            return saved;
          }}
          onSaveEdit={async (id, payload) => {
            const updated = await updateAssessment(
              id,
              payload,
              activeStudent.altura_cm,
            );
            setView({
              screen: 'profile',
              studentId: activeStudent.id,
            });
            return updated;
          }}
        />
      );
    }

    if (view.screen === 'card' && activeStudent) {
      return (
        <CardViewer
          student={activeStudent}
          targetAssessmentId={view.assessmentId}
          onBack={() =>
            setView({ screen: 'profile', studentId: activeStudent.id })
          }
        />
      );
    }

    if (view.screen === 'tab' && view.tab === 'access') {
      return (
        <AccessManager
          students={students}
          onToggleAccess={toggleClientAccess}
          onRegenerateAccess={regenerateClientAccess}
          onPreviewAsClient={(studentId) =>
            setView({ screen: 'client-preview', studentId })
          }
          onSelectStudent={(studentId) =>
            setView({ screen: 'profile', studentId })
          }
        />
      );
    }

    return (
      <TrainerDashboard
        mode={view.screen === 'tab' && view.tab === 'students' ? 'students' : 'overview'}
        students={students}
        loading={studentsLoading}
        error={studentsError}
        onSelectStudent={(studentId) =>
          setView({ screen: 'profile', studentId })
        }
        onOpenCard={(studentId) => setView({ screen: 'card', studentId })}
        onPreviewAsClient={(studentId) =>
          setView({ screen: 'client-preview', studentId })
        }
        onOpenNewStudent={() => setIsNewStudentModalOpen(true)}
        onGoToAccess={() => setView({ screen: 'tab', tab: 'access' })}
      />
    );
  };

  return (
    <>
      <TrainerLayout
        user={user}
        isDemoMode={isDemoMode}
        activeTab={activeTab}
        onChangeTab={(tab) => setView({ screen: 'tab', tab })}
        onOpenNewStudent={() => setIsNewStudentModalOpen(true)}
        onRefresh={handleRefresh}
        onSignOut={signOut}
        refreshing={refreshing}
      >
        {renderContent()}
      </TrainerLayout>

      <StudentModal
        isOpen={isNewStudentModalOpen}
        onClose={() => setIsNewStudentModalOpen(false)}
        onSubmit={async (payload) => {
          const created = await createStudent(payload);
          setView({ screen: 'profile', studentId: created.id });
        }}
      />
    </>
  );
}

export default App;
