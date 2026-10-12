import { useState } from 'react'
import { getAuraCharacter } from '../../data/auraCharacters'
import { Corners, DossierPanel } from './SharedBits'

// Hero-шапка профиля: досье оператора с картой персонажа уровня
export default function ProfileHeader({
  username, email, aura, isOwner = false, shareUrl, idCode,
  avatarUrl, avatarBusy, avatarError, onPickAvatar, onRemoveAvatar,
}) {
  const [copied, setCopied] = useState(false)
  const char = getAuraCharacter(aura.level)

  const onShare = async () => {
    const url = shareUrl || window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: `${username} — xAura`, url })
        return
      }
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-8">
      {/* Верхняя техническая лента */}
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase" style={{ color: char.accent }}>
          {aura.title}
        </span>
        <span className="flex-1 h-px bg-gradient-to-r from-brand-medium to-transparent" />
        <span className="dossier-note">
          {idCode ? `ID ${idCode}` : 'ID —'} · СЕКТОР: ПРОФИЛЬ
        </span>
      </div>

      <DossierPanel accent={char.accent}>
        {/* Подложка: точечная матрица + вертикальная риска справа */}
        <div className="absolute inset-0 dots-bg opacity-60 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-[220px] w-px bg-brand-medium/40 hidden xl:block pointer-events-none" />

        <div className="relative px-5 sm:px-8 pt-6 pb-5">
          <div className="flex flex-col lg:flex-row gap-7">
            {/* Левая колонка: аватар в Aura Core + данные оператора */}
            <div className="flex items-start gap-5 min-w-0">
              {/* Уникальное ядро Aura вокруг аватара */}
              <div className="relative flex-shrink-0">
                <div className="aura-core" style={{ '--aura-accent': char.accent }}>
                  <div className="aura-core-ring" />
                  <div className="aura-core-avatar">
                    <div className="absolute inset-0 hatch opacity-40" />
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={username} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center font-display font-bold text-4xl sm:text-[42px]" style={{ color: char.accent }}>
                        {username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 h-6 flex items-center justify-between px-2 bg-black/85">
                      <span className="font-mono text-[8px] font-bold" style={{ color: char.accent }}>LVL</span>
                      <span className="font-display font-bold text-sm leading-none" style={{ color: char.accent }}>{aura.level}</span>
                    </div>
                    {avatarBusy && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10"><div className="w-5 h-5 rounded-full border-2 border-neon-400/30 border-t-neon-400 animate-spin" /></div>}
                  </div>
                </div>
                {/* Управление аватаром — только владелец */}
                {isOwner && (
                  <div className="mt-1.5 flex items-center justify-center gap-2">
                    <button onClick={onPickAvatar} disabled={avatarBusy} className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-text-muted hover:text-neon-400 transition-colors disabled:opacity-40">{avatarUrl ? 'сменить' : 'загрузить'}</button>
                    {avatarUrl && <button onClick={onRemoveAvatar} disabled={avatarBusy} className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-text-subtle hover:text-danger transition-colors disabled:opacity-40">убрать</button>}
                  </div>
                )}
                {avatarError && <p className="mt-1 text-[9px] font-mono text-danger text-center max-w-[100px] leading-tight">{avatarError}</p>}
              </div>

              {/* Имя + XP-шкала */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-1">
                  <h1 className="font-display font-bold text-[26px] sm:text-[34px] leading-none text-white tracking-tight break-all">
                    {username}
                  </h1>
                  {aura.level >= 14 && (
                    <span className="stamp px-2 py-1 font-mono text-[8px] font-bold tracking-[0.2em] text-neon-400 -rotate-3">
                      ВЕТТЕРАН
                    </span>
                  )}
                </div>
                {isOwner && email && (
                  <p className="dossier-note mb-3 truncate normal-case tracking-normal text-[10px]">{email}</p>
                )}

                {/* Компактная строка ауры + поделиться */}
                <div className="mt-3 flex items-center flex-wrap gap-x-4 gap-y-1.5">
                  <span className="dossier-note">
                    AURA · <span className="text-neon-400 font-bold">{aura.xp.toLocaleString('ru')}</span> XP · УР. {aura.level}
                  </span>
                  <button
                    onClick={onShare}
                    className="font-mono text-[9px] font-bold tracking-[0.14em] uppercase text-neon-400 hover:text-neon-300 transition-colors cursor-pointer"
                  >
                    {copied ? '✓ скопировано' : '⇄ профиль'}
                  </button>
                </div>
              </div>
            </div>

            {/* Правая колонка: ID-карта персонажа уровня */}
            <div className="flex-shrink-0 lg:ml-auto">
              <div className="flex items-stretch gap-0">
                {/* Карточка персонажа */}
                <div
                  className="relative w-[168px] overflow-hidden bg-[#0A0D07] transition-colors duration-300"
                >
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <picture>
                      <source srcSet={char.webp} type="image/webp" />
                      <img
                        src={char.gif}
                        alt={`${char.name} — ${char.anime}`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </picture>
                    <div className="absolute inset-0 scanlines" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
                    <span
                      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 font-mono text-[7px] font-bold tracking-[0.18em] uppercase bg-black/80"
                      style={{ color: char.accent }}
                    >
                      spirit
                    </span>
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="font-display font-bold text-[13px] text-white leading-none truncate">{char.name}</p>
                    <p className="dossier-note mt-1 truncate">{char.anime}</p>
                  </div>
                </div>

                {/* Боковая аннотация карточки */}
                <div className="hidden sm:flex flex-col justify-between w-7 py-1 pr-1">
                  <span
                    className="font-mono text-[7px] font-bold tracking-widest"
                    style={{ writingMode: 'vertical-rl', color: `${char.accent}cc` }}
                  >
                    {char.anime.toUpperCase()}
                  </span>
                  <span
                    className="font-mono text-[7px] tracking-widest text-text-subtle"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    LV {aura.level} // {char.chips[0]}
                  </span>
                </div>
              </div>
              <p className="dossier-note mt-2 leading-relaxed normal-case tracking-normal text-[10px] text-text-muted italic font-sans">
                «{char.quote}»
              </p>
            </div>
          </div>
        </div>
      </DossierPanel>
    </div>
  )
}
