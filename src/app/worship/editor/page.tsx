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
import { EditorSkeleton } from '@/app/worship/components/editor/EditorSkeleton';
import { SlidesPanel } from '@/app/worship/components/editor/SlidesPanel';
import { LyricsPanel } from '@/app/worship/components/editor/LyricsPanel';
import { PreviewPanel } from '@/app/worship/components/editor/PreviewPanel';
import { ControllerView } from '@/app/worship/components/editor/ControllerView';

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

  // Auto-launch presenter when navigated here with ?present=1
  const autoPresent = searchParams.get('present') === '1';
  useEffect(() => {
    if (autoPresent && !isLoading) void openPresenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

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
        onEndPresentation={endPresentation}
      />
    );
  }

  return (
    <div className='flex flex-col gap-5 flex-1 min-h-0'>
      {/* Header */}
      <div className='flex items-center justify-between gap-4 shrink-0'>
        <div className='flex items-center gap-3 min-w-0'>
          <button
            onClick={() => router.push('/worship')}
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
          <SaveButton onSave={handleSave} isSaving={isSaving} saved={saved} />
          <button
            onClick={openPresenter}
            className='inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors'
          >
            <Tv2 className='h-4 w-4' />
            Open Presenter
            <ExternalLink className='h-3.5 w-3.5 opacity-70' />
          </button>
        </div>
      </div>

      {/* 3-panel body */}
      <div className='flex gap-5 flex-1 min-h-0'>
        <SlidesPanel
          slides={slides}
          current={current}
          activeSlideRef={activeSlideRef}
          onGoTo={goTo}
        />

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
  );
}

export default function WorshipEditorPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <WorshipEditorInner />
    </Suspense>
  );
}
