import React from 'react';
import './group-directory-admin-ui.css';

export type DirectoryState = 'ready' | 'loading' | 'empty' | 'error' | 'forbidden';
export type LifecycleStatus = 'ACTIVE' | 'PASSIVE';
export type GroupType = 'MANUAL' | 'DYNAMIC' | 'SYSTEM';

export interface GroupSummary { id: string; name: string; type: GroupType; status: LifecycleStatus; memberCount: number; description?: string; }
export interface GroupMemberSummary { employeeId: string; fullName: string; source: 'MANUAL' | 'RULE' | 'SYSTEM'; validFrom: string; validUntil: string | null; }
export interface DirectoryItem { id: string; name: string; code: string; status: LifecycleStatus; }

export interface GroupDirectoryActions {
  onCreateGroup?: () => void;
  onAddMember?: (groupId: string) => void;
  onRemoveMember?: (groupId: string, employeeId: string) => void;
  onPassivateGroup?: (groupId: string) => void;
  onReactivateGroup?: (groupId: string) => void;
  onCreatePosition?: () => void;
  onPassivatePosition?: (id: string) => void;
  onReactivatePosition?: (id: string) => void;
  onCreateLocation?: () => void;
  onPassivateLocation?: (id: string) => void;
  onReactivateLocation?: (id: string) => void;
}

export interface GroupDirectoryAdminProps extends GroupDirectoryActions {
  state: DirectoryState;
  groups: readonly GroupSummary[];
  selectedGroup?: GroupSummary;
  members?: readonly GroupMemberSummary[];
  positions: readonly DirectoryItem[];
  locations: readonly DirectoryItem[];
}

const groupLabels: Record<GroupType, string> = { MANUAL: 'Manuel', DYNAMIC: 'Dinamik', SYSTEM: 'Sistem' };

export function canManuallyMutateGroup(type: GroupType): boolean { return type === 'MANUAL'; }
export function dynamicBuilderEnabled(): false { return false; }

function StatePanel({ state }: { state: Exclude<DirectoryState, 'ready'> }) {
  const text = { loading: 'Organizasyon dizini yükleniyor…', empty: 'Henüz kayıt bulunmuyor.', error: 'Dizin bilgileri alınamadı.', forbidden: 'Bu alanı yönetme yetkiniz yok.' } as const;
  return <section className="gd-state" role={state === 'error' || state === 'forbidden' ? 'alert' : undefined}>{text[state]}</section>;
}

function LifecycleButton({ item, kind, actions }: { item: DirectoryItem; kind: 'position' | 'location'; actions: GroupDirectoryActions }) {
  const passive = item.status === 'PASSIVE';
  const handler = kind === 'position'
    ? passive ? actions.onReactivatePosition : actions.onPassivatePosition
    : passive ? actions.onReactivateLocation : actions.onPassivateLocation;
  return <button type="button" onClick={() => handler?.(item.id)}>{passive ? 'Yeniden Aktifleştir' : 'Pasife Al'}</button>;
}

export function GroupDirectoryAdminView(props: GroupDirectoryAdminProps) {
  if (props.state !== 'ready') return <StatePanel state={props.state} />;
  const selected = props.selectedGroup;
  return <main className="gd-page">
    <header className="gd-header"><div><p>Organizasyon Yönetimi</p><h1>Gruplar, Pozisyonlar ve Lokasyonlar</h1></div><button type="button" onClick={props.onCreateGroup}>Grup Oluştur</button></header>
    <section className="gd-grid">
      <article className="gd-card"><h2>Gruplar</h2>{props.groups.length === 0 ? <p>Henüz grup yok.</p> : <ul>{props.groups.map((group) => <li key={group.id}><div><strong>{group.name}</strong><span>{groupLabels[group.type]} · {group.memberCount} üye · {group.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</span></div>{group.status === 'ACTIVE' ? <button type="button" onClick={() => props.onPassivateGroup?.(group.id)}>Pasife Al</button> : <button type="button" onClick={() => props.onReactivateGroup?.(group.id)}>Yeniden Aktifleştir</button>}</li>)}</ul>}</article>
      <article className="gd-card gd-detail"><h2>Grup Detayı</h2>{!selected ? <p>Detay için bir grup seçin.</p> : <><div className="gd-detail-head"><div><strong>{selected.name}</strong><span>{groupLabels[selected.type]}</span></div>{canManuallyMutateGroup(selected.type) ? <button type="button" onClick={() => props.onAddMember?.(selected.id)}>Üye Ekle</button> : <span className="gd-readonly">Üyelik {selected.type === 'DYNAMIC' ? 'kural' : 'sistem'} tarafından yönetilir</span>}</div>{selected.type === 'DYNAMIC' && <div className="gd-gate">Dinamik Grup Builder V1 için feature-gated/deferred.</div>}<ul>{(props.members ?? []).map((member) => <li key={member.employeeId}><div><strong>{member.fullName}</strong><span>{member.source} · {member.validFrom}{member.validUntil ? ` → ${member.validUntil}` : ' → aktif'}</span></div>{canManuallyMutateGroup(selected.type) && member.validUntil === null ? <button type="button" onClick={() => props.onRemoveMember?.(selected.id, member.employeeId)}>Üyeliği Sonlandır</button> : null}</li>)}</ul></>}</article>
    </section>
    <section className="gd-grid">
      <article className="gd-card"><div className="gd-card-head"><h2>Pozisyonlar</h2><button type="button" onClick={props.onCreatePosition}>Pozisyon Ekle</button></div><ul>{props.positions.map((item) => <li key={item.id}><div><strong>{item.name}</strong><span>{item.code} · {item.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</span></div><LifecycleButton item={item} kind="position" actions={props} /></li>)}</ul></article>
      <article className="gd-card"><div className="gd-card-head"><h2>Lokasyonlar</h2><button type="button" onClick={props.onCreateLocation}>Lokasyon Ekle</button></div><ul>{props.locations.map((item) => <li key={item.id}><div><strong>{item.name}</strong><span>{item.code} · {item.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}</span></div><LifecycleButton item={item} kind="location" actions={props} /></li>)}</ul></article>
    </section>
  </main>;
}
