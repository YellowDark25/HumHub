humhub.module('nexchat', function (module, require, $) {
    const client = require('client');

    let state = {
        eventSources: [],
        intervals: [],
        conversationId: null,
        historyLoading: false,
        userScrolledUp: false,
        pendingFiles: [],
        reactTargetId: null,
        replyTo: null,
        canModerate: false,
        deletePendingId: null,
    };

    const ICONS = {
        react: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
        reply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>',
        edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
        trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    };

    const escapeHtml = function (value) {
        return $('<div>').text(value == null ? '' : value).html();
    };

    const escapeAttr = function (value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const storageKey = function (conversationId) {
        return 'nexchat_seen_' + conversationId;
    };

    const getSeenMessageId = function (conversationId) {
        return parseInt(window.localStorage.getItem(storageKey(conversationId)) || '0', 10) || 0;
    };

    const markSeen = function (conversationId, messageId) {
        const current = getSeenMessageId(conversationId);
        if (messageId > current) {
            window.localStorage.setItem(storageKey(conversationId), String(messageId));
        }
        updateSidebarBadge(conversationId, 0);
    };

    const updateSidebarBadge = function (conversationId, count) {
        const $item = $('.nexchat-sidebar-item[data-conversation-id="' + conversationId + '"]');
        const $badge = $item.find('.nexchat-unread-badge');
        if (!$badge.length) {
            return;
        }
        if (count > 0) {
            $badge.text(count > 9 ? '9+' : count).prop('hidden', false);
            $item.addClass('has-unread');
        } else {
            $badge.prop('hidden', true);
            $item.removeClass('has-unread');
        }
    };

    const trackInterval = function (timerId) {
        state.intervals.push(timerId);
        return timerId;
    };

    const openEventSource = function (url) {
        const source = new EventSource(url);
        state.eventSources.push(source);
        return source;
    };

    const formatSize = function (bytes) {
        bytes = parseInt(bytes, 10) || 0;
        if (bytes < 1024) {
            return bytes + ' B';
        }
        if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + ' KB';
        }
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const renderAttachmentsHtml = function (attachments) {
        if (!attachments || !attachments.length) {
            return '';
        }

        const parts = attachments.map(function (att) {
            const url = escapeHtml(att.url);
            const name = escapeHtml(att.name);
            if (att.isImage) {
                return `<a class="nexchat-attachment-image" href="${url}" target="_blank" rel="noopener">
                    <img src="${url}" alt="${name}" loading="lazy"></a>`;
            }
            return `<a class="nexchat-attachment-file" href="${url}" target="_blank" rel="noopener" download>
                <span class="nexchat-attachment-icon">&#128206;</span>
                <span class="nexchat-attachment-info">
                    <span class="nexchat-attachment-name">${name}</span>
                    <span class="nexchat-attachment-size">${escapeHtml(formatSize(att.size))}</span>
                </span></a>`;
        });

        return `<div class="nexchat-attachments">${parts.join('')}</div>`;
    };

    const computeMine = function (reaction) {
        if (reaction.mine) {
            return true;
        }
        const ids = reaction.userIds || [];
        return ids.indexOf(module.config.currentUserId) !== -1;
    };

    const renderReactionsHtml = function (reactions, messageId) {
        const pills = (reactions || []).map(function (reaction) {
            const mine = computeMine(reaction) ? ' mine' : '';
            const title = escapeHtml((reaction.users || []).join(', '));
            return `<button type="button" class="nexchat-reaction-pill${mine}" data-emoji="${escapeHtml(reaction.emoji)}" title="${title}">
                <span class="nexchat-reaction-emoji">${escapeHtml(reaction.emoji)}</span>
                <span class="nexchat-reaction-count">${parseInt(reaction.count, 10) || 0}</span>
            </button>`;
        });

        return `<div class="nexchat-reactions" data-message-id="${messageId}">${pills.join('')}</div>`;
    };

    const renderReplyAvatarHtml = function (avatarUrl, authorName) {
        if (avatarUrl) {
            return `<span class="nexchat-reply-avatar"><img src="${escapeHtml(avatarUrl)}" alt="" loading="lazy"></span>`;
        }
        const initial = escapeHtml((authorName || 'U').charAt(0).toUpperCase());
        return `<span class="nexchat-reply-avatar"><span class="nexchat-avatar-fallback">${initial}</span></span>`;
    };

    const renderReplyQuoteHtml = function (replyTo) {
        if (!replyTo) {
            return '';
        }
        return `<a class="nexchat-reply-quote" href="#" data-reply-target="${replyTo.id}">
            <span class="nexchat-reply-icon">&#8627;</span>
            ${renderReplyAvatarHtml(replyTo.avatarUrl, replyTo.authorName)}
            <span class="nexchat-reply-author">${escapeHtml(replyTo.authorName)}</span>
            <span class="nexchat-reply-preview">${escapeHtml(replyTo.preview)}</span>
        </a>`;
    };

    const renderMessageHtml = function (message) {
        const authorName = message.authorName || 'Usuário';
        const author = escapeHtml(authorName);
        const time = escapeHtml(message.createdAt || '');
        const rawContent = message.content || '';
        const content = escapeHtml(rawContent).replace(/\n/g, '<br>');
        const ownClass = message.userId === module.config.currentUserId ? ' nexchat-message-own' : '';

        let avatar;
        if (message.avatarUrl) {
            avatar = `<img src="${escapeHtml(message.avatarUrl)}" alt="${author}" loading="lazy">`;
        } else {
            const initial = escapeHtml(authorName.charAt(0).toUpperCase());
            avatar = `<span class="nexchat-avatar-fallback">${initial}</span>`;
        }

        if (message.deleted) {
            return `
            <div class="nexchat-message nexchat-message-deleted" data-message-id="${message.id}" data-content="">
                <div class="nexchat-avatar">${avatar}</div>
                <div class="nexchat-message-body">
                    <div class="nexchat-message-meta">
                        <span class="nexchat-message-author">${author}</span>
                        <span class="nexchat-message-time">${time}</span>
                    </div>
                    <div class="nexchat-message-content nexchat-deleted-text"><span class="nexchat-deleted-icon">&#128465;</span> Mensagem excluída</div>
                </div>
            </div>`;
        }

        const contentHtml = rawContent.trim() !== ''
            ? `<div class="nexchat-message-content">${content}</div>`
            : '';

        const isOwn = message.userId === module.config.currentUserId;
        const now = Math.floor(Date.now() / 1000);
        const editWindow = module.config.editWindowSeconds || 3600;
        const withinWindow = message.createdAtTs && (now - message.createdAtTs) <= editWindow;
        const canEdit = isOwn && withinWindow;
        const canDelete = isOwn || state.canModerate;

        const editBtn = canEdit
            ? '<button type="button" class="nexchat-action-edit" title="Editar">' + ICONS.edit + '</button>'
            : '';
        const deleteBtn = canDelete
            ? '<button type="button" class="nexchat-action-delete" title="Excluir">' + ICONS.trash + '</button>'
            : '';

        const editedHidden = message.editedAt ? '' : ' hidden';

        return `
            <div class="nexchat-message${ownClass}" data-message-id="${message.id}" data-content="${escapeAttr(rawContent)}">
                <div class="nexchat-avatar">${avatar}</div>
                <div class="nexchat-message-body">
                    ${renderReplyQuoteHtml(message.replyTo)}
                    <div class="nexchat-message-meta">
                        <span class="nexchat-message-author">${author}</span>
                        <span class="nexchat-message-time">${time}</span>
                        <span class="nexchat-message-edited"${editedHidden}>(editado)</span>
                    </div>
                    ${contentHtml}
                    ${renderAttachmentsHtml(message.attachments)}
                    ${renderReactionsHtml(message.reactions, message.id)}
                </div>
                <div class="nexchat-message-actions">
                    <button type="button" class="nexchat-action-react" title="Adicionar reação">${ICONS.react}</button>
                    <button type="button" class="nexchat-action-reply" title="Responder">${ICONS.reply}</button>
                    ${editBtn}
                    ${deleteBtn}
                </div>
            </div>`;
    };

    const updateMessageReactions = function (messageId, reactions) {
        const $reactions = $('.nexchat-message[data-message-id="' + messageId + '"] .nexchat-reactions');
        if ($reactions.length) {
            $reactions.replaceWith(renderReactionsHtml(reactions, messageId));
        }
    };

    const appendMessage = function ($container, message, scrollToBottom) {
        if (!$container.length || $container.find('.nexchat-message[data-message-id="' + message.id + '"]').length) {
            return;
        }

        $container.append(renderMessageHtml(message));

        if (scrollToBottom !== false) {
            $container.scrollTop($container[0].scrollHeight);
        }
    };

    const prependMessages = function ($container, messages) {
        const $anchor = $container.find('#nexchat-load-history').first();
        const previousHeight = $container[0].scrollHeight;

        messages.forEach(function (message) {
            if ($container.find('.nexchat-message[data-message-id="' + message.id + '"]').length) {
                return;
            }
            const html = renderMessageHtml(message);
            if ($anchor.length) {
                $anchor.after(html);
            } else {
                $container.prepend(html);
            }
        });

        $container.scrollTop($container[0].scrollHeight - previousHeight);
    };

    const notifyNewMessage = function (conversationId, message, activeConversationId) {
        if (conversationId === activeConversationId) {
            return;
        }

        const seen = getSeenMessageId(conversationId);
        if (message.id <= seen) {
            return;
        }

        const unread = Math.max(1, message.id - seen);
        updateSidebarBadge(conversationId, unread);

        if (document.hidden && window.Notification && Notification.permission === 'granted') {
            const preview = message.content || (message.attachments && message.attachments.length ? '📎 Anexo' : '');
            new Notification('Nova mensagem no Chat', {
                body: (message.authorName || 'Usuário') + ': ' + preview.substring(0, 120),
            });
        }
    };

    const handleMercurePayload = function (payload, activeConversationId, viewState) {
        if (payload.type === 'nexchat.reaction') {
            if (viewState && payload.conversationId === viewState.conversationId) {
                updateMessageReactions(payload.messageId, payload.reactions);
            }
            return;
        }

        if (payload.type === 'nexchat.editMessage') {
            if (viewState && payload.conversationId === viewState.conversationId && payload.message) {
                applyEditedMessage(payload.message);
            }
            return;
        }

        if (payload.type === 'nexchat.deleteMessage') {
            if (viewState && payload.conversationId === viewState.conversationId) {
                if (payload.message) {
                    applyEditedMessage(payload.message);
                } else {
                    removeMessage(payload.messageId);
                }
            }
            return;
        }

        if (payload.type !== 'nexchat.newMessage' || !payload.message) {
            return;
        }

        const conversationId = payload.conversationId;
        const message = payload.message;

        if (viewState && conversationId === viewState.conversationId) {
            if (message.id <= viewState.lastMessageId) {
                return;
            }

            appendMessage(viewState.$messages, message);
            viewState.lastMessageId = message.id;
            markSeen(conversationId, message.id);
            return;
        }

        notifyNewMessage(conversationId, message, activeConversationId);
    };

    const refreshBadges = function (activeConversationId) {
        client.get(module.config.updatesUrl).then(function (response) {
            if (!response.conversations) {
                return;
            }

            response.conversations.forEach(function (item) {
                if (item.id === activeConversationId) {
                    markSeen(item.id, item.lastMessageId);
                    return;
                }

                const seen = getSeenMessageId(item.id);
                if (item.lastMessageId > seen) {
                    updateSidebarBadge(item.id, Math.min(9, item.lastMessageId - seen));
                }
            });
        }).catch(function () {});
    };

    const connectMercure = function (config, onMessage, onError) {
        if (!config.jwt || !config.hubUrl || typeof EventSource === 'undefined') {
            return null;
        }

        const url = new URL(config.hubUrl);
        url.searchParams.set('authorization', config.jwt);
        url.searchParams.set('topic', config.topic || '*');

        const source = openEventSource(url.toString());

        source.onmessage = function (event) {
            try {
                onMessage(JSON.parse(event.data));
            } catch (e) {
                module.log.error('Nexchat mercure parse error', e);
            }
        };

        if (onError) {
            source.onerror = function () {
                source.close();
                onError();
            };
        }

        return source;
    };

    const initNotifications = function (activeConversationId) {
        if (window.Notification && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        refreshBadges(activeConversationId);
        trackInterval(window.setInterval(function () {
            refreshBadges(activeConversationId);
        }, 8000));

        client.get(module.config.subscribeAllUrl).then(function (config) {
            connectMercure(config, function (payload) {
                handleMercurePayload(payload, activeConversationId, null);
            });
        }).catch(function () {});
    };

    const sendReaction = function (messageId, emoji) {
        client.post(module.config.reactUrl, {
            data: { message_id: messageId, emoji: emoji },
        }).then(function (response) {
            if (response.success) {
                updateMessageReactions(response.messageId, response.reactions);
            }
        }).catch(function (err) {
            module.log.error('Nexchat react failed', err);
        });
    };

    const setReply = function (messageId, authorName, preview, avatarUrl) {
        state.replyTo = { id: messageId, authorName: authorName, preview: preview, avatarUrl: avatarUrl };
        $('#nexchat-reply-bar-author').text(authorName);
        $('#nexchat-reply-bar-preview').text(preview);
        $('#nexchat-reply-bar-avatar').html(renderReplyAvatarHtml(avatarUrl, authorName));
        $('#nexchat-reply-bar').prop('hidden', false);
        $('#nexchat-message-input').focus();
    };

    const clearReply = function () {
        state.replyTo = null;
        $('#nexchat-reply-bar').prop('hidden', true);
    };

    const scrollToMessage = function ($messages, messageId) {
        const $target = $messages.find('.nexchat-message[data-message-id="' + messageId + '"]');
        if (!$target.length) {
            return;
        }
        const offset = $target.position().top + $messages.scrollTop() - 20;
        $messages.animate({ scrollTop: offset }, 200);
        $target.removeClass('nexchat-message-highlight');
        void $target[0].offsetWidth;
        $target.addClass('nexchat-message-highlight');
    };

    const replyPreviewFromMessage = function ($message) {
        const text = ($message.find('.nexchat-message-content').first().text() || '').trim();
        if (text !== '') {
            return text.substring(0, 80);
        }
        if ($message.find('.nexchat-attachments').length) {
            return '📎 Anexo';
        }
        return '';
    };

    const applyEditedMessage = function (message) {
        const $existing = $('.nexchat-message[data-message-id="' + message.id + '"]');
        if ($existing.length) {
            $existing.replaceWith(renderMessageHtml(message));
        }
    };

    const removeMessage = function (messageId) {
        $('.nexchat-message[data-message-id="' + messageId + '"]').remove();
    };

    const cancelInlineEdit = function ($message) {
        $message.find('.nexchat-edit-form').remove();
        $message.find('.nexchat-message-content').show();
    };

    const startInlineEdit = function ($message) {
        if ($message.find('.nexchat-edit-form').length) {
            return;
        }

        const messageId = parseInt($message.data('message-id'), 10);
        const current = $message.attr('data-content') || '';
        const $body = $message.find('.nexchat-message-body');
        const $content = $message.find('.nexchat-message-content');

        $content.hide();

        const $form = $(
            '<div class="nexchat-edit-form">' +
            '<textarea class="nexchat-edit-input"></textarea>' +
            '<div class="nexchat-edit-hint">esc para <a class="nexchat-edit-cancel">cancelar</a> &bull; enter para <a class="nexchat-edit-save">salvar</a></div>' +
            '</div>'
        );

        if ($content.length) {
            $content.after($form);
        } else {
            $body.find('.nexchat-message-meta').after($form);
        }

        const $textarea = $form.find('.nexchat-edit-input');
        $textarea.val(current);
        $textarea.focus();
        $textarea[0].setSelectionRange(current.length, current.length);

        const save = function () {
            const newContent = ($textarea.val() || '').trim();
            if (newContent === '') {
                alert('A mensagem não pode ficar vazia. Para remover, use excluir.');
                return;
            }
            if (newContent === current) {
                cancelInlineEdit($message);
                return;
            }

            client.post(module.config.editUrl, {
                data: { message_id: messageId, content: newContent },
            }).then(function (response) {
                if (response.success && response.message) {
                    applyEditedMessage(response.message);
                } else if (response.error) {
                    alert(response.error);
                }
            }).catch(function (err) {
                module.log.error('Nexchat edit failed', err);
                alert('Não foi possível salvar a edição.');
            });
        };

        $textarea.on('keydown', function (evt) {
            if (evt.key === 'Enter' && !evt.shiftKey) {
                evt.preventDefault();
                save();
            } else if (evt.key === 'Escape') {
                evt.preventDefault();
                cancelInlineEdit($message);
            }
        });

        $form.find('.nexchat-edit-save').on('click', save);
        $form.find('.nexchat-edit-cancel').on('click', function () {
            cancelInlineEdit($message);
        });
    };

    const openDeleteModal = function ($message, messageId) {
        state.deletePendingId = messageId;

        $('#nexchat-delete-avatar').html($message.find('.nexchat-avatar').first().html());
        $('#nexchat-delete-author').text(($message.find('.nexchat-message-author').first().text() || '').trim());
        $('#nexchat-delete-time').text(($message.find('.nexchat-message-time').first().text() || '').trim());

        const content = $message.attr('data-content') || '';
        $('#nexchat-delete-content').text(content !== '' ? content : '📎 Anexo');

        $('#nexchat-delete-modal').prop('hidden', false);
    };

    const closeDeleteModal = function () {
        state.deletePendingId = null;
        $('#nexchat-delete-modal').prop('hidden', true);
    };

    const deleteMessage = function (messageId) {
        client.post(module.config.deleteUrl, {
            data: { message_id: messageId },
        }).then(function (response) {
            if (response.success && response.message) {
                applyEditedMessage(response.message);
            } else if (response.success) {
                removeMessage(messageId);
            } else if (response.error) {
                alert(response.error);
            }
        }).catch(function (err) {
            module.log.error('Nexchat delete failed', err);
            alert('Não foi possível excluir a mensagem.');
        });
    };

    const closeEmojiPicker = function () {
        $('#nexchat-emoji-picker').prop('hidden', true);
        state.reactTargetId = null;
    };

    const openEmojiPicker = function ($button, messageId) {
        const $picker = $('#nexchat-emoji-picker');
        if (!$picker.length) {
            return;
        }

        state.reactTargetId = messageId;

        const rect = $button[0].getBoundingClientRect();
        $picker.prop('hidden', false);

        const pickerWidth = $picker.outerWidth();
        const pickerHeight = $picker.outerHeight();
        let left = rect.right - pickerWidth;
        let top = rect.bottom + 6;
        if (left < 8) {
            left = 8;
        }
        if (top + pickerHeight > window.innerHeight - 8) {
            top = rect.top - pickerHeight - 6;
        }

        $picker.css({ left: left + 'px', top: top + 'px' });
    };

    const renderFilePreview = function () {
        const $preview = $('#nexchat-attachment-preview');
        if (!$preview.length) {
            return;
        }

        $preview.empty();

        if (!state.pendingFiles.length) {
            $preview.prop('hidden', true);
            return;
        }

        $preview.prop('hidden', false);

        state.pendingFiles.forEach(function (file, index) {
            const $item = $('<div class="nexchat-preview-item">');
            if (file.type && file.type.indexOf('image/') === 0) {
                const $img = $('<img class="nexchat-preview-thumb">');
                $img.attr('src', URL.createObjectURL(file));
                $item.append($img);
            } else {
                $item.append('<span class="nexchat-attachment-icon">&#128206;</span>');
            }
            $item.append($('<span class="nexchat-preview-name">').text(file.name));
            const $remove = $('<button type="button" class="nexchat-preview-remove" title="Remover">&times;</button>');
            $remove.on('click', function () {
                state.pendingFiles.splice(index, 1);
                renderFilePreview();
            });
            $item.append($remove);
            $preview.append($item);
        });
    };

    const initConversationView = function (activeConversationId) {
        const $root = $('.nexchat-chat[data-nexchat-conversation]');
        if (!$root.length) {
            return;
        }

        const conversationId = parseInt($root.data('nexchat-conversation'), 10);
        const $messages = $('#nexchat-messages');
        const $form = $('#nexchat-send-form');
        const $input = $('#nexchat-message-input');
        const $fileInput = $('#nexchat-file-input');
        let lastMessageId = parseInt($root.data('last-message-id'), 10) || 0;
        let oldestMessageId = parseInt($root.data('oldest-message-id'), 10) || 0;
        let hasMoreHistory = String($root.data('has-more-history')) === '1';
        let pollTimer = null;

        const viewState = {
            conversationId: conversationId,
            $messages: $messages,
            lastMessageId: lastMessageId,
        };

        state.conversationId = conversationId;
        state.pendingFiles = [];
        state.canModerate = String($root.data('can-moderate')) === '1';
        markSeen(conversationId, lastMessageId);

        const scrollToBottom = function () {
            if ($messages.length) {
                $messages.scrollTop($messages[0].scrollHeight);
            }
        };

        scrollToBottom();
        trackInterval(window.setTimeout(scrollToBottom, 100));

        const startPolling = function () {
            if (pollTimer) {
                return;
            }

            pollTimer = trackInterval(window.setInterval(function () {
                client.get(module.config.pollUrl, {
                    data: { id: conversationId, since: viewState.lastMessageId },
                }).then(function (response) {
                    (response.messages || []).forEach(function (message) {
                        appendMessage($messages, message);
                        viewState.lastMessageId = Math.max(viewState.lastMessageId, message.id);
                        lastMessageId = viewState.lastMessageId;
                        markSeen(conversationId, lastMessageId);
                    });
                }).catch(function () {});
            }, 3000));
        };

        const loadHistory = function () {
            if (!hasMoreHistory || oldestMessageId <= 0 || state.historyLoading) {
                return;
            }

            state.historyLoading = true;

            client.get(module.config.historyUrl, {
                data: { id: conversationId, before: oldestMessageId },
            }).then(function (response) {
                if (!response.messages || !response.messages.length) {
                    hasMoreHistory = false;
                    $('#nexchat-load-history').remove();
                    return;
                }

                prependMessages($messages, response.messages);
                oldestMessageId = response.messages[0].id;
                hasMoreHistory = !!response.hasMore;

                if (!hasMoreHistory) {
                    $('#nexchat-load-history').remove();
                }
            }).catch(function (err) {
                module.log.error('Nexchat history load failed', err);
            }).always(function () {
                state.historyLoading = false;
            });
        };

        client.get(module.config.subscribeUrl, {
            data: { id: conversationId },
        }).then(function (config) {
            const source = connectMercure(config, function (payload) {
                handleMercurePayload(payload, activeConversationId, viewState);
            }, startPolling);

            if (!source) {
                startPolling();
            }
        }).catch(function () {
            startPolling();
        });

        const submitMessage = function () {
            const content = ($input.val() || '').trim();
            if (!content && !state.pendingFiles.length) {
                return;
            }

            const formData = new FormData();
            formData.append('conversation_id', conversationId);
            formData.append('content', content);
            formData.append(yii.getCsrfParam(), yii.getCsrfToken());
            if (state.replyTo && state.replyTo.id) {
                formData.append('reply_to_id', state.replyTo.id);
            }
            state.pendingFiles.forEach(function (file) {
                formData.append('files[]', file);
            });

            $form.find('button').prop('disabled', true);

            $.ajax({
                url: module.config.sendUrl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                dataType: 'json',
            }).done(function (response) {
                if (response && response.success && response.message) {
                    appendMessage($messages, response.message);
                    viewState.lastMessageId = Math.max(viewState.lastMessageId, response.message.id);
                    lastMessageId = viewState.lastMessageId;
                    markSeen(conversationId, lastMessageId);
                    $input.val('');
                    state.pendingFiles = [];
                    renderFilePreview();
                    clearReply();
                    if (response.warnings && response.warnings.length) {
                        module.log.warn(response.warnings.join('\n'));
                    }
                } else if (response && response.error) {
                    module.log.error(response.error);
                    alert(response.error);
                }
            }).fail(function (err) {
                module.log.error('Nexchat send failed', err);
                alert('Não foi possível enviar a mensagem.');
            }).always(function () {
                $form.find('button').prop('disabled', false);
                $input.focus();
            });
        };

        $form.off('.nexchat').on('submit.nexchat', function (evt) {
            evt.preventDefault();
            submitMessage();
        });

        $('#nexchat-attach-btn').off('.nexchat').on('click.nexchat', function () {
            $fileInput.trigger('click');
        });

        $fileInput.off('.nexchat').on('change.nexchat', function () {
            const files = Array.prototype.slice.call(this.files || []);
            files.forEach(function (file) {
                state.pendingFiles.push(file);
            });
            this.value = '';
            renderFilePreview();
        });

        $('#nexchat-load-history').off('.nexchat').on('click.nexchat', loadHistory);

        $messages.off('.nexchat').on('scroll.nexchat', function () {
            const distanceFromBottom = $messages[0].scrollHeight - $messages.scrollTop() - $messages.outerHeight();
            state.userScrolledUp = distanceFromBottom > 80;

            if (state.userScrolledUp && $messages.scrollTop() < 40 && hasMoreHistory) {
                loadHistory();
            }
        });

        $messages.on('click.nexchat', '.nexchat-action-react', function (evt) {
            evt.stopPropagation();
            const messageId = parseInt($(this).closest('.nexchat-message').data('message-id'), 10);
            openEmojiPicker($(this), messageId);
        });

        $messages.on('click.nexchat', '.nexchat-reaction-pill', function () {
            const messageId = parseInt($(this).closest('.nexchat-message').data('message-id'), 10);
            const emoji = $(this).data('emoji');
            sendReaction(messageId, String(emoji));
        });

        $messages.on('click.nexchat', '.nexchat-action-reply', function () {
            const $message = $(this).closest('.nexchat-message');
            const messageId = parseInt($message.data('message-id'), 10);
            const authorName = ($message.find('.nexchat-message-author').first().text() || 'Usuário').trim();
            const avatarUrl = $message.find('.nexchat-avatar img').first().attr('src') || '';
            setReply(messageId, authorName, replyPreviewFromMessage($message), avatarUrl);
        });

        $messages.on('click.nexchat', '.nexchat-reply-quote', function (evt) {
            evt.preventDefault();
            const targetId = parseInt($(this).data('reply-target'), 10);
            if (targetId) {
                scrollToMessage($messages, targetId);
            }
        });

        $messages.on('click.nexchat', '.nexchat-action-edit', function () {
            startInlineEdit($(this).closest('.nexchat-message'));
        });

        $messages.on('click.nexchat', '.nexchat-action-delete', function (evt) {
            const $message = $(this).closest('.nexchat-message');
            const messageId = parseInt($message.data('message-id'), 10);
            if (evt.shiftKey) {
                deleteMessage(messageId);
            } else {
                openDeleteModal($message, messageId);
            }
        });

        $('#nexchat-delete-confirm').off('.nexchat').on('click.nexchat', function () {
            if (state.deletePendingId) {
                deleteMessage(state.deletePendingId);
            }
            closeDeleteModal();
        });

        $('#nexchat-delete-cancel, #nexchat-delete-close').off('.nexchat').on('click.nexchat', function () {
            closeDeleteModal();
        });

        $('#nexchat-delete-modal').off('.nexchat').on('click.nexchat', function (evt) {
            if (evt.target === this) {
                closeDeleteModal();
            }
        });

        $(document).off('keydown.nexchatmodal').on('keydown.nexchatmodal', function (evt) {
            if (evt.key !== 'Escape') {
                return;
            }
            if (!$('#nexchat-delete-modal').prop('hidden')) {
                closeDeleteModal();
            }
            if (!$('#nexchat-invite-modal').prop('hidden') || !$('#nexchat-settings-modal').prop('hidden')) {
                $('#nexchat-invite-modal, #nexchat-settings-modal').prop('hidden', true);
                const $del = $('#nexchat-delete-channel');
                if ($del.length) {
                    $del.attr('data-armed', '0').removeClass('armed').text('Excluir canal');
                }
            }
        });

        $('#nexchat-reply-cancel').off('.nexchat').on('click.nexchat', function () {
            clearReply();
        });

        $input.off('keydown.nexchatreply').on('keydown.nexchatreply', function (evt) {
            if (evt.key === 'Escape' && state.replyTo) {
                clearReply();
            }
        });

        $('#nexchat-emoji-picker').off('.nexchat').on('click.nexchat', '.nexchat-emoji-option', function () {
            const emoji = $(this).data('emoji');
            if (state.reactTargetId) {
                sendReaction(state.reactTargetId, String(emoji));
            }
            closeEmojiPicker();
        });

        $(document).off('click.nexchatpicker').on('click.nexchatpicker', function (evt) {
            const $target = $(evt.target);
            if (!$target.closest('#nexchat-emoji-picker').length && !$target.closest('.nexchat-action-react').length) {
                closeEmojiPicker();
            }
        });

        const openChannelModal = function (id) {
            $('#' + id).prop('hidden', false);
        };

        const closeChannelModals = function () {
            $('#nexchat-invite-modal, #nexchat-settings-modal').prop('hidden', true);
            const $del = $('#nexchat-delete-channel');
            if ($del.length) {
                $del.attr('data-armed', '0').removeClass('armed').text('Excluir canal');
            }
        };

        $('#nexchat-open-invite').off('.nexchat').on('click.nexchat', function () {
            openChannelModal('nexchat-invite-modal');
        });

        $('#nexchat-open-settings').off('.nexchat').on('click.nexchat', function () {
            openChannelModal('nexchat-settings-modal');
        });

        $('#nexchat-invite-close, #nexchat-invite-cancel, #nexchat-settings-close').off('.nexchat').on('click.nexchat', function () {
            closeChannelModals();
        });

        $('#nexchat-invite-modal, #nexchat-settings-modal').off('.nexchat').on('click.nexchat', function (evt) {
            if (evt.target === this) {
                closeChannelModals();
            }
        });

        $('#nexchat-invite-form').off('.nexchat').on('submit.nexchat', function (evt) {
            evt.preventDefault();
            const userId = parseInt($('#nexchat-invite-user').val(), 10);
            if (!userId) {
                return;
            }

            client.post(module.config.inviteUrl, {
                data: { conversation_id: conversationId, user_id: userId },
            }).then(function (response) {
                if (response && response.success === false && response.error) {
                    alert(response.error);
                    return;
                }
                window.location.reload();
            }).catch(function (err) {
                module.log.error('Nexchat invite failed', err);
            });
        });

        $('#nexchat-rename-form').off('.nexchat').on('submit.nexchat', function (evt) {
            evt.preventDefault();
            const name = ($('#nexchat-rename-input').val() || '').trim();
            if (name === '') {
                return;
            }

            client.post(module.config.renameChannelUrl, {
                data: { conversation_id: conversationId, name: name },
            }).then(function (response) {
                if (response && response.success) {
                    window.location.reload();
                } else if (response && response.error) {
                    alert(response.error);
                }
            }).catch(function (err) {
                module.log.error('Nexchat rename failed', err);
            });
        });

        $('#nexchat-delete-channel').off('.nexchat').on('click.nexchat', function () {
            const $btn = $(this);
            if ($btn.attr('data-armed') !== '1') {
                $btn.attr('data-armed', '1').addClass('armed').text('Clique novamente para confirmar');
                return;
            }

            client.post(module.config.deleteChannelUrl, {
                data: { conversation_id: conversationId },
            }).then(function (response) {
                if (response && response.success) {
                    window.location = response.url || module.config.indexUrl;
                } else if (response && response.error) {
                    alert(response.error);
                }
            }).catch(function (err) {
                module.log.error('Nexchat delete channel failed', err);
            });
        });

        $('.nexchat-dm-member').off('.nexchat').on('click.nexchat', function () {
            const userId = parseInt($(this).data('user-id'), 10);
            if (!userId) {
                return;
            }

            client.post(module.config.openDmUrl, {
                data: { user_id: userId },
            }).then(function (response) {
                if (response.success && response.url) {
                    window.location = response.url;
                }
            }).catch(function (err) {
                module.log.error('Nexchat open DM failed', err);
            });
        });

        $('.nexchat-remove-member').off('.nexchat').on('click.nexchat', function () {
            const userId = parseInt($(this).data('user-id'), 10);
            if (!userId || !window.confirm('Remover este membro do canal?')) {
                return;
            }

            client.post(module.config.removeMemberUrl, {
                data: { conversation_id: conversationId, user_id: userId },
            }).then(function () {
                window.location.reload();
            });
        });
    };

    const bindInviteHandlers = function () {
        $('.nexchat-invite-accept').off('.nexchatinvite').on('click.nexchatinvite', function () {
            const conversationId = parseInt($(this).data('conversation-id'), 10);
            if (!conversationId) {
                return;
            }
            const $btns = $(this).closest('.nexchat-invite-actions').find('button').prop('disabled', true);

            client.post(module.config.acceptInviteUrl, {
                data: { conversation_id: conversationId },
            }).then(function (response) {
                if (response && response.success) {
                    window.location = response.url || module.config.indexUrl;
                } else {
                    $btns.prop('disabled', false);
                    if (response && response.error) {
                        alert(response.error);
                    }
                }
            }).catch(function (err) {
                $btns.prop('disabled', false);
                module.log.error('Nexchat accept invite failed', err);
            });
        });

        $('.nexchat-invite-decline').off('.nexchatinvite').on('click.nexchatinvite', function () {
            const conversationId = parseInt($(this).data('conversation-id'), 10);
            if (!conversationId) {
                return;
            }
            const $item = $(this).closest('.nexchat-invite-item');

            client.post(module.config.declineInviteUrl, {
                data: { conversation_id: conversationId },
            }).then(function () {
                const $section = $item.closest('.nexchat-invites-section');
                $item.remove();
                if (!$section.find('.nexchat-invite-item').length) {
                    $section.remove();
                }
            }).catch(function (err) {
                module.log.error('Nexchat decline invite failed', err);
            });
        });
    };

    const destroy = function () {
        $('.nexchat-invite-accept, .nexchat-invite-decline').off('.nexchatinvite');

        state.eventSources.forEach(function (source) {
            try {
                source.close();
            } catch (e) {
                // ignore
            }
        });

        state.intervals.forEach(function (timerId) {
            window.clearInterval(timerId);
            window.clearTimeout(timerId);
        });

        $('#nexchat-send-form, #nexchat-load-history, #nexchat-messages, #nexchat-invite-form, #nexchat-attach-btn, #nexchat-file-input, #nexchat-emoji-picker, #nexchat-reply-cancel, #nexchat-delete-confirm, #nexchat-delete-cancel, #nexchat-delete-close, #nexchat-delete-modal, #nexchat-open-invite, #nexchat-open-settings, #nexchat-invite-close, #nexchat-invite-cancel, #nexchat-settings-close, #nexchat-invite-modal, #nexchat-settings-modal, #nexchat-rename-form, #nexchat-delete-channel')
            .off('.nexchat');
        $('#nexchat-message-input').off('keydown.nexchatreply');
        $('.nexchat-dm-member, .nexchat-remove-member').off('.nexchat');
        $(document).off('click.nexchatpicker');
        $(document).off('keydown.nexchatmodal');

        state = {
            eventSources: [],
            intervals: [],
            conversationId: null,
            historyLoading: false,
            userScrolledUp: false,
            pendingFiles: [],
            reactTargetId: null,
            replyTo: null,
            canModerate: false,
            deletePendingId: null,
        };
    };

    const init = function (activeConversationId) {
        destroy();

        bindInviteHandlers();

        if (activeConversationId) {
            initConversationView(activeConversationId);
            refreshBadges(activeConversationId);
            trackInterval(window.setInterval(function () {
                refreshBadges(activeConversationId);
            }, 8000));
        } else {
            initNotifications(null);
        }
    };

    $(window).off('beforeunload.nexchat pagehide.nexchat').on('beforeunload.nexchat pagehide.nexchat', destroy);

    module.export({ init: init, destroy: destroy });
});
