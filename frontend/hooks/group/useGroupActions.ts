import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { addMembers, createGroup, deleteGroup, demoteAdmin, leaveGroup, promoteMember, removeMember, updateGroup } from "@/services/groups";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function useGroupActions() {
    const queryClient = useQueryClient();

    const router = useRouter();

    const createMutation = useMutation({
        mutationFn: createGroup,

        onSuccess: (data) => {

            toast.success("Group Created!");

            queryClient.invalidateQueries({
                queryKey: queryKeys.conversations,
            });

            router.replace(`/chat/${data.conversationId}`);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteGroup,

        onSuccess: () => {
            toast.success("Group Deleted!")

            queryClient.invalidateQueries({
                queryKey: queryKeys.conversations,
            });

            router.replace("/chat");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const leaveMutation = useMutation({
        mutationFn: leaveGroup,

        onSuccess: () => {
            toast.success("You left the group")

            queryClient.invalidateQueries({
                queryKey: queryKeys.conversations,
            });

            router.replace("/chat");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateGroup,

        onSuccess: (_, variables) => {
            toast.success("Group info updated!");

            queryClient.invalidateQueries({
                queryKey: queryKeys.groupInfo(
                    variables.groupId
                ),
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.conversations,
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const addMembersMutation = useMutation({
        mutationFn: addMembers,

        onSuccess: (_, variables) => {
            toast.success("Members added!");

            queryClient.invalidateQueries({
                queryKey: queryKeys.groupInfo(
                    variables.groupId
                ),
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.conversations,
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: ({
            groupId,
            memberId,
        }: {
            groupId: string;
            memberId: string;
        }) => removeMember(groupId, memberId),

        onSuccess: () => {
            toast.success("Member removed");
        },
    });

    const promoteMutation = useMutation({
        mutationFn: ({
            groupId,
            memberId,
        }: {
            groupId: string;
            memberId: string;
        }) => promoteMember(groupId, memberId),

        onSuccess: () => {
            toast.success("Admin promoted");
        },
    });

    const demoteMutation = useMutation({
        mutationFn: ({
            groupId,
            memberId,
        }: {
            groupId: string;
            memberId: string;
        }) => demoteAdmin(groupId, memberId),

        onSuccess: () => {
            toast.success("Admin demoted");
        },
    });

    return {
        createGroup: createMutation.mutate,
        isCreatingGroup: createMutation.isPending,

        deleteGroup: deleteMutation.mutate,
        isDeletingGroup: deleteMutation.isPending,

        leaveGroup: leaveMutation.mutate,
        isLeaving: leaveMutation.isPending,

        updateGroup: updateMutation.mutate,
        isUpdating: updateMutation.isPending,

        addMembers: addMembersMutation.mutateAsync,
        isAddingMembers: addMembersMutation.isPending,

        removeMember: removeMemberMutation.mutate,
        isRemovingMember: removeMemberMutation.isPending,

        promoteMember: promoteMutation.mutate,
        isPromotingMember: promoteMutation.isPending,

        demoteAdmin: demoteMutation.mutate,
        isDemotingAdmin: demoteMutation.isPending,
    };
}