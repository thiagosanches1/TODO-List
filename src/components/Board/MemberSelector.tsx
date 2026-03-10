import type { Profile } from '@/store/kanbanStore';
import { User } from 'lucide-react';

interface MemberSelectorProps {
    members: Profile[];
    selectedMemberId?: string;
    onSelect: (memberId: string | undefined) => void;
    className?: string;
}

export function MemberSelector({ members, selectedMemberId, onSelect, className }: MemberSelectorProps) {
    return (
        <div className={`relative ${className}`}>
            <div className="flex items-center gap-2 bg-muted/30 border border-border/50 rounded-xl px-3 py-2 hover:bg-muted/50 transition-all">
                <User className="w-4 h-4 text-muted-foreground" />
                <select
                    value={selectedMemberId || ''}
                    onChange={(e) => onSelect(e.target.value || undefined)}
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full cursor-pointer appearance-none outline-none"
                >
                    <option value="" className="bg-background">Não atribuído</option>
                    {members.map((member) => (
                        <option key={member.id} value={member.id} className="bg-background">
                            {member.fullName || member.email?.split('@')[0] || 'Usuário'} ({member.email})
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
