'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart, Bell, Store, Tag, Settings, LogOut, ChevronRight,
  Bookmark, Shield, Smartphone
} from 'lucide-react';

type Tab = 'saved' | 'follows' | 'settings';

export default function MyPage() {
  const [tab, setTab] = useState<Tab>('saved');
  const [isLoggedIn] = useState(false); // TODO: Supabase Auth 연동

  // 비로그인 상태
  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Smartphone className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-surface-900">마이페이지</h1>
        <p className="mt-2 text-surface-500 text-sm">
          로그인하면 딜 저장, 브랜드 구독, 알림 설정을 이용할 수 있어요
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
        >
          <Smartphone className="w-4 h-4" />
          휴대폰으로 시작하기
        </Link>

        {/* 미리보기 — 로그인 안 해도 보이는 메뉴 */}
        <div className="mt-12 text-left">
          <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">
            로그인 후 이용 가능
          </h2>
          <div className="bg-white rounded-xl border border-surface-200 divide-y divide-surface-100">
            <MenuPreview icon={<Bookmark className="w-5 h-5" />} label="저장한 딜" desc="관심 딜을 저장하고 관리하세요" />
            <MenuPreview icon={<Store className="w-5 h-5" />} label="구독 브랜드" desc="좋아하는 브랜드의 새 딜 알림 받기" />
            <MenuPreview icon={<Tag className="w-5 h-5" />} label="관심 카테고리" desc="맞춤 카테고리 기반 추천" />
            <MenuPreview icon={<Bell className="w-5 h-5" />} label="알림 설정" desc="카카오/SMS/이메일 알림 설정" />
            <MenuPreview icon={<Shield className="w-5 h-5" />} label="마케팅 동의" desc="마케팅 수신 동의 관리" />
          </div>
        </div>
      </div>
    );
  }

  // === 로그인 상태 (TODO: 실제 데이터 연결) ===
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 프로필 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-white">P</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900">사용자</h1>
            <p className="text-sm text-surface-500">010-****-1234</p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-sm text-surface-400 hover:text-surface-600 transition-colors">
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-surface-200 mb-6">
        <TabButton icon={<Heart className="w-4 h-4" />} label="저장 딜" active={tab === 'saved'} onClick={() => setTab('saved')} />
        <TabButton icon={<Store className="w-4 h-4" />} label="구독" active={tab === 'follows'} onClick={() => setTab('follows')} />
        <TabButton icon={<Settings className="w-4 h-4" />} label="설정" active={tab === 'settings'} onClick={() => setTab('settings')} />
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'saved' && <SavedDealsTab />}
      {tab === 'follows' && <FollowsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}

// --- 저장 딜 탭 ---
function SavedDealsTab() {
  return (
    <div className="text-center py-12">
      <Bookmark className="w-10 h-10 text-surface-300 mx-auto mb-3" />
      <p className="text-surface-500 font-medium">저장한 딜이 없습니다</p>
      <p className="text-sm text-surface-400 mt-1">딜 상세에서 하트를 눌러 저장하세요</p>
      <Link
        href="/"
        className="mt-4 inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
      >
        딜 둘러보기 <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// --- 구독 탭 ---
function FollowsTab() {
  return (
    <div className="space-y-6">
      {/* 브랜드 구독 */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-3">구독 브랜드</h3>
        <div className="text-center py-8 bg-surface-50 rounded-xl">
          <Store className="w-8 h-8 text-surface-300 mx-auto mb-2" />
          <p className="text-sm text-surface-400">구독한 브랜드가 없습니다</p>
          <Link
            href="/search"
            className="mt-2 inline-flex text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            브랜드 둘러보기
          </Link>
        </div>
      </div>

      {/* 관심 카테고리 */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-3">관심 카테고리</h3>
        <div className="text-center py-8 bg-surface-50 rounded-xl">
          <Tag className="w-8 h-8 text-surface-300 mx-auto mb-2" />
          <p className="text-sm text-surface-400">관심 카테고리를 선택하세요</p>
        </div>
      </div>
    </div>
  );
}

// --- 설정 탭 ---
function SettingsTab() {
  return (
    <div className="space-y-6">
      {/* 알림 설정 */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          알림 설정
        </h3>
        <div className="space-y-4">
          <ToggleSetting label="카카오 알림톡" desc="새 딜/마감 임박 알림" />
          <ToggleSetting label="SMS 알림" desc="중요 딜 알림" />
          <ToggleSetting label="이메일 알림" desc="주간 다이제스트" />
          <ToggleSetting label="푸시 알림" desc="실시간 알림 (추후 지원)" disabled />
        </div>
      </div>

      {/* 알림 빈도 */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="font-semibold text-surface-900 mb-4">알림 빈도</h3>
        <div className="space-y-2">
          <RadioOption label="즉시 알림" value="instant" selected />
          <RadioOption label="일일 다이제스트" value="daily_digest" />
          <RadioOption label="주간 다이제스트" value="weekly_digest" />
        </div>
      </div>

      {/* 마케팅 동의 */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          마케팅 동의
        </h3>
        <ToggleSetting
          label="마케팅 정보 수신 동의"
          desc="할인/프로모션 관련 마케팅 정보를 받습니다"
        />
        <p className="text-xs text-surface-400 mt-3">
          동의를 철회하면 마케팅 관련 알림이 즉시 중단됩니다.
        </p>
      </div>

      {/* 계정 */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="font-semibold text-surface-900 mb-4">계정</h3>
        <button className="text-sm text-red-500 hover:text-red-600 font-medium">
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}

// --- 공통 컴포넌트 ---
function TabButton({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
        active ? 'text-primary-500' : 'text-surface-400 hover:text-surface-600'
      }`}
    >
      {icon}
      {label}
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />}
    </button>
  );
}

function MenuPreview({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 opacity-60">
      <div className="text-surface-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-700">{label}</p>
        <p className="text-xs text-surface-400">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-surface-300" />
    </div>
  );
}

function ToggleSetting({ label, desc, disabled = false }: {
  label: string; desc: string; disabled?: boolean;
}) {
  const [on, setOn] = useState(false);
  return (
    <div className={`flex items-center justify-between ${disabled ? 'opacity-40' : ''}`}>
      <div>
        <p className="text-sm font-medium text-surface-700">{label}</p>
        <p className="text-xs text-surface-400">{desc}</p>
      </div>
      <button
        onClick={() => !disabled && setOn(!on)}
        disabled={disabled}
        className={`w-10 h-6 rounded-full transition-colors relative ${
          on ? 'bg-primary-500' : 'bg-surface-200'
        }`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          on ? 'left-5' : 'left-1'
        }`} />
      </button>
    </div>
  );
}

function RadioOption({ label, value, selected = false }: {
  label: string; value: string; selected?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
        selected ? 'border-primary-500' : 'border-surface-300'
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-primary-500" />}
      </div>
      <span className="text-sm text-surface-700">{label}</span>
    </label>
  );
}
