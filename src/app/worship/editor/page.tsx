'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ExternalLink,
  ArrowLeft,
  Tv2,
  Save,
  Check,
} from 'lucide-react';
import { usePresentation } from '@/hooks/usePresentation';
import { useEditorState } from '@/hooks/useEditorState';
import { useConfirm } from '@/hooks/useConfirm';
import { EditorSkeleton } from '@/app/worship/components/editor/EditorSkeleton';
import { SlidesPanel } from '@/app/worship/components/editor/SlidesPanel';
import { LyricsPanel } from '@/app/worship/components/editor/LyricsPanel';
import { PreviewPanel } from '@/app/worship/components/editor/PreviewPanel';
import { ControllerView } from '@/app/worship/components/editor/ControllerView';
import { TourTrigger } from '@/components/guides/TourTrigger';

function SaveButton({
  onSave,
  isSaving,
  saved,
}: {
  onSave: () => void;
  isSaving: boolean;
  saved: boolean;
}) {
  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        saved
          ? 'bg-green-500/15 border border-green-500/30 text-green-500'
          : 'border border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      }`}
    >
      {saved ? <Check className='h-4 w-4' /> : <Save className='h-4 w-4' />}
      {saved ? 'Saved' : isSaving ? 'Saving…' : 'Save'}
    </button>
  );
}

function WorshipEditorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presentationId = searchParams.get('id');

  const presentation = usePresentation(presentationId);
  const {
    title,
    setTitle,
    lyrics,
    setLyrics,
    initialQueue,
    slides,
    setSlides,
    current,
    bgId,
    transitionId,
    fontId,
    sizeId,
    transSpeed,
    animSpeed,
    mode,
    setMode,
    isPresenterOpen,
    isSaving,
    saved,
    titleError,
    setTitleError,
    isLoading,
    activeSlideRef,
    bgCls,
    currentFamily,
    currentSlide,
    nextSlide,
    goTo,
    changeBg,
    changeTr,
    changeFont,
    changeSize,
    changeTransSpeed,
    changeAnimSpeed,
    handleSave: _handleSave,
    openPresenter,
    endPresentation,
  } = presentation;

  const editor = useEditorState({ lyrics, setLyrics, setSlides, initialQueue });

  const handleSave = () => _handleSave(editor.songQueue);

  const [confirmEnd, ConfirmEndDialog] = useConfirm({
    title: 'Presentation is Running',
    description: 'A presentation is currently live. Leaving will end it for the audience.',
    confirmLabel: 'End & Leave',
    variant: 'destructive',
  });

  const handleBack = async () => {
    if (isPresenterOpen) {
      const ok = await confirmEnd();
      if (!ok) return;
      endPresentation();
    }
    router.push('/worship');
  };

  // Auto-launch presenter when navigated here with ?present=1
  const autoPresent = searchParams.get('present') === '1';
  useEffect(() => {
    if (autoPresent && !isLoading) void openPresenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // End presentation and remove ?present=1 from the URL so a page reload
  // doesn't auto-reopen the presenter.
  const handleEndPresentation = () => {
    endPresentation();
    const cleanUrl = presentationId
      ? `/worship/editor?id=${presentationId}`
      : '/worship/editor';
    router.replace(cleanUrl);
  };

  if (isLoading) return <EditorSkeleton />;

  if (mode === 'controller') {
    return (
      <ControllerView
        title={title}
        slides={slides}
        current={current}
        currentSlide={currentSlide}
        nextSlide={nextSlide}
        bgCls={bgCls}
        currentFamily={currentFamily}
        sizeId={sizeId}
        bgId={bgId}
        transitionId={transitionId}
        fontId={fontId}
        transSpeed={transSpeed}
        animSpeed={animSpeed}
        mode={mode}
        bgDialogOpen={editor.bgDialogOpen}
        setBgDialogOpen={editor.setBgDialogOpen}
        settingsOpen={editor.settingsOpen}
        setSettingsOpen={editor.setSettingsOpen}
        activeSlideRef={activeSlideRef}
        onBackToEditor={() => setMode('editor')}
        onGoTo={goTo}
        onChangeBg={changeBg}
        onChangeTr={changeTr}
        onChangeFont={changeFont}
        onChangeSize={changeSize}
        onChangeTransSpeed={changeTransSpeed}
        onChangeAnimSpeed={changeAnimSpeed}
        onOpenPresenter={openPresenter}
        onEndPresentation={handleEndPresentation}
      />
    );
  }

  return (
    <>
    {ConfirmEndDialog}
    <div className='flex flex-col gap-5 flex-1 min-h-0'>
      {/* Header */}
      <div className='flex items-center justify-between gap-4 shrink-0' data-tour="worship-editor-header">
        <div className='flex items-center gap-3 min-w-0'>
          <button
            onClick={handleBack}
            className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0'
          >
            <ArrowLeft className='h-4 w-4' />
            All Presentations
          </button>
          <span className='text-border shrink-0'>|</span>
          <div className='flex-1 min-w-0'>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError(false);
              }}
              placeholder='Presentation title…'
              className={`w-full bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/40 border-b pb-0.5 transition-colors ${
                titleError
                  ? 'border-destructive'
                  : 'border-transparent focus:border-border'
              }`}
            />
            {titleError && (
              <p className='text-[10px] text-destructive mt-0.5'>
                Title is required to save
              </p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <TourTrigger tourId="worship-editor" />
          <SaveButton onSave={handleSave} isSaving={isSaving} saved={saved} />
          <button
            onClick={openPresenter}
            className='inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
          >
            <Tv2 className='h-4 w-4' />
            Open Presenter
            <ExternalLink className='h-3.5 w-3.5 opacity-70' />
          </button>
        </div>
      </div>

      {/* 3-panel body */}
      <div className='flex gap-5 flex-1 min-h-0'>
        <div data-tour="worship-slides-panel" className="shrink-0 flex flex-col min-h-0">
          <SlidesPanel
            slides={slides}
            current={current}
            activeSlideRef={activeSlideRef}
            onGoTo={goTo}
          />
        </div>

        <div data-tour="worship-lyrics-panel" className="shrink-0 flex flex-col min-h-0">
          <LyricsPanel
            lyricsMode={editor.lyricsMode}
            setLyricsMode={editor.setLyricsMode}
            lyrics={lyrics}
            setLyrics={setLyrics}
            quotaExhausted={editor.quotaExhausted}
            songQueue={editor.songQueue}
            editingIdx={editor.editingIdx}
            editTitle={editor.editTitle}
            setEditTitle={editor.setEditTitle}
            editArtist={editor.editArtist}
            setEditArtist={editor.setEditArtist}
            editRole={editor.editRole}
            setEditRole={editor.setEditRole}
            editLyrics={editor.editLyrics}
            setEditLyrics={editor.setEditLyrics}
            onStartEdit={editor.handleStartEdit}
            onSaveEdit={editor.handleSaveEdit}
            onCancelEdit={editor.handleCancelEdit}
            onRemoveSong={editor.handleRemoveSong}
            onDragEnd={editor.handleDragEnd}
            addDialogOpen={editor.addDialogOpen}
            setAddDialogOpen={editor.setAddDialogOpen}
            addMode={editor.addMode}
            setAddMode={editor.setAddMode}
            manualRole={editor.manualRole}
            setManualRole={editor.setManualRole}
            manualTitle={editor.manualTitle}
            setManualTitle={editor.setManualTitle}
            manualArtist={editor.manualArtist}
            setManualArtist={editor.setManualArtist}
            manualLyricsText={editor.manualLyricsText}
            setManualLyricsText={editor.setManualLyricsText}
            onAddManualSong={editor.handleAddManualSong}
            sectionLabel={editor.sectionLabel}
            setSectionLabel={editor.setSectionLabel}
            onAddSection={editor.handleAddSection}
            aiDescription={editor.aiDescription}
            setAiDescription={editor.setAiDescription}
            aiLoading={editor.aiLoading}
            aiError={editor.aiError}
            setAiError={editor.setAiError}
            aiResults={editor.aiResults}
            expandedIdx={editor.expandedIdx}
            setExpandedIdx={editor.setExpandedIdx}
            fetchingIdx={editor.fetchingIdx}
            aiRoleInputIdx={editor.aiRoleInputIdx}
            setAiRoleInputIdx={editor.setAiRoleInputIdx}
            aiRoleInputValue={editor.aiRoleInputValue}
            setAiRoleInputValue={editor.setAiRoleInputValue}
            quotaLoading={editor.quotaLoading}
            quotaUsed={editor.quotaUsed}
            quotaRemaining={editor.quotaRemaining}
            quotaLimit={editor.quotaLimit}
            isCoolingDown={editor.isCoolingDown}
            cooldownSecsLeft={editor.cooldownSecsLeft}
            onSearch={() => void editor.handleSearchLyrics()}
            onFetchLyrics={(idx) => void editor.handleFetchLyrics(idx)}
            onSelectSong={editor.handleSelectSong}
            onRemoveFromQueue={editor.handleRemoveFromQueue}
          />
        </div>

        <div data-tour="worship-preview-panel" className="flex-1 min-w-0 flex flex-col min-h-0">
          <PreviewPanel
            currentSlide={currentSlide}
            bgCls={bgCls}
            currentFamily={currentFamily}
            sizeId={sizeId}
            slides={slides}
            current={current}
            bgId={bgId}
            transitionId={transitionId}
            fontId={fontId}
            transSpeed={transSpeed}
            animSpeed={animSpeed}
            bgDialogOpen={editor.bgDialogOpen}
            setBgDialogOpen={editor.setBgDialogOpen}
            onGoTo={goTo}
            onChangeBg={changeBg}
            onChangeTr={changeTr}
            onChangeFont={changeFont}
            onChangeSize={changeSize}
            onChangeTransSpeed={changeTransSpeed}
            onChangeAnimSpeed={changeAnimSpeed}
          />
        </div>
      </div>
    </div>
    </>
  );
}

export default function WorshipEditorPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <WorshipEditorInner />
    </Suspense>
  );
}
