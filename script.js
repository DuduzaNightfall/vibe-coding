class TodoApp {
    constructor() {
        this.tasks = this.loadTasks(); // Carrega tarefas do localStorage
        this.currentFilter = 'all'; // Filtro inicial: 'all', 'pending', 'completed'

        // 1. Inicializa elementos do DOM
        this.taskForm = document.getElementById('todo-form');
        this.newTaskInput = document.getElementById('new-task');
        this.taskList = document.getElementById('task-list');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.totalTasksSpan = document.getElementById('total-tasks');
        this.completedTasksSpan = document.getElementById('completed-tasks');

        // 2. Configura event listeners
        this.addEventListeners();

        // Renderiza a interface inicial
        this.render();
    }

    /**
     * Carrega as tarefas salvas do localStorage, com tratamento de dados corrompidos.
     * @returns {Array} Um array de tarefas.
     */
    loadTasks() {
        const tasksJSON = localStorage.getItem('tasks');
        if (tasksJSON) {
            try {
                const parsedTasks = JSON.parse(tasksJSON);
                // Validação robusta: Garante que é um array e contém objetos com a estrutura mínima esperada
                if (Array.isArray(parsedTasks) && parsedTasks.every(task =>
                    typeof task.id === 'number' &&
                    typeof task.text === 'string' &&
                    typeof task.completed === 'boolean'
                )) {
                    return parsedTasks;
                } else {
                    console.warn("Dados no localStorage estão corrompidos ou em formato inválido. Iniciando com lista vazia.");
                    return [];
                }
            } catch (e) {
                // Erro ao fazer parse do JSON (ex: string inválida)
                console.error("Erro ao fazer parse dos dados do localStorage:", e);
                return []; // Retorna lista vazia em caso de erro
            }
        }
        return []; // Retorna array vazio se não houver nada no localStorage
    }

    /**
     * Salva as tarefas atuais no localStorage.
     */
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    /**
     * Configura os event listeners para os elementos do DOM.
     */
    addEventListeners() {
        // Adiciona nova tarefa ao submeter o formulário
        this.taskForm.addEventListener('submit', this.addTask.bind(this));

        // Delegação de eventos para cliques nos botões de completar e deletar tarefas
        this.taskList.addEventListener('click', this.handleTaskActions.bind(this));

        // Event listeners para os botões de filtro
        this.filterButtons.forEach(button => {
            button.addEventListener('click', this.setFilter.bind(this));
        });
    }

    /**
     * Adiciona uma nova tarefa à lista.
     * Captura o texto do input, valida, cria objeto e adiciona.
     * @param {Event} event - O evento de submit do formulário.
     */
    addTask(event) {
        event.preventDefault(); // Impede o recarregamento da página

        const taskText = this.newTaskInput.value.trim();
        const MAX_TASK_LENGTH = 255; // Limite de caracteres para a tarefa

        // Validação: input vazio
        if (taskText === '') {
            // Feedback visual para input vazio
            this.newTaskInput.classList.add('empty-input');
            setTimeout(() => {
                this.newTaskInput.classList.remove('empty-input');
            }, 1000); // Remove a classe após 1 segundo
            this.newTaskInput.focus(); // Foca no input vazio
            alert('Por favor, digite uma tarefa antes de adicionar!');
            return;
        }

        // Validação: limite de caracteres
        if (taskText.length > MAX_TASK_LENGTH) {
            alert(`A tarefa não pode ter mais de ${MAX_TASK_LENGTH} caracteres.`);
            this.newTaskInput.focus();
            return;
        }

        // Validação de IDs únicos: Garante que o ID é único mesmo se Date.now() gerar o mesmo valor
        let newId = Date.now();
        while (this.tasks.some(task => task.id === newId)) {
            newId++; // Incrementa o ID até que seja único
        }

        const newTask = {
            id: newId, // Usa o ID garantido como único
            text: taskText,
            completed: false // Nova tarefa sempre começa como não concluída
        };

        this.tasks.push(newTask);
        this.saveTasks(); // Salva as tarefas após adicionar
        this.newTaskInput.value = ''; // Limpa o campo de input
        this.render(); // Atualiza a interface
    }

    /**
     * Manipula as ações de completar ou deletar tarefas usando delegação de eventos.
     * @param {Event} event - O evento de clique na lista de tarefas.
     */
    handleTaskActions(event) {
        const target = event.target;
        const taskItem = target.closest('.task-item'); // Encontra o item da tarefa pai

        if (!taskItem) return; // Se o clique não foi dentro de um item de tarefa, ignora

        // Pega o ID da tarefa do atributo data-id e valida se é um número
        const taskId = parseInt(taskItem.dataset.id);
        if (isNaN(taskId)) {
            console.error("ID da tarefa inválido no DOM:", taskItem.dataset.id);
            return; // Impede a execução se o ID for inválido
        }

        if (target.classList.contains('complete-btn')) {
            this.toggleComplete(taskId);
        } else if (target.classList.contains('delete-btn')) {
            this.deleteTask(taskId);
        }
    }

    /**
     * Alterna o status de conclusão de uma tarefa (toggle).
     * @param {number} id - O ID da tarefa a ser alternada.
     */
    toggleComplete(id) {
        // Validação: garante que a tarefa existe antes de tentar modificar
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex === -1) {
            console.warn(`Tarefa com ID ${id} não encontrada para alternar status.`);
            return;
        }

        this.tasks = this.tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this.saveTasks(); // Salva as tarefas após modificar
        this.render(); // Atualiza a interface
    }

    /**
     * Remove uma tarefa da lista.
     * @param {number} id - O ID da tarefa a ser deletada.
     */
    deleteTask(id) {
        // Validação: garante que a tarefa existe antes de tentar deletar
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex === -1) {
            console.warn(`Tarefa com ID ${id} não encontrada para exclusão.`);
            return;
        }

        // Confirmação antes de remover
        const confirmDelete = confirm('Tem certeza que deseja remover esta tarefa?');

        if (confirmDelete) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks(); // Salva as tarefas após deletar
            this.render(); // Atualiza a interface
        }
    }

    /**
     * Define o filtro ativo e re-renderiza a lista.
     * @param {Event} event - O evento de clique no botão de filtro.
     */
    setFilter(event) {
        const newFilter = event.target.dataset.filter;
        if (this.currentFilter !== newFilter) {
            this.currentFilter = newFilter;
            this.render(); // Re-renderiza a lista com o novo filtro
        }
    }

    /**
     * Renderiza (ou atualiza) a interface do usuário com base no estado atual das tarefas
     * e o filtro ativo, e também atualiza os contadores.
     */
    render() {
        this.taskList.innerHTML = ''; // Limpa a lista antes de renderizar novamente

        // Calcula os contadores (total e concluídas) antes de filtrar para refletir o total geral
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;

        // Atualiza os elementos HTML dos contadores
        this.totalTasksSpan.textContent = totalTasks;
        this.completedTasksSpan.textContent = completedTasks;

        // Filtra as tarefas com base no currentFilter
        let filteredTasks = [];
        if (this.currentFilter === 'all') {
            filteredTasks = this.tasks;
        } else if (this.currentFilter === 'pending') {
            filteredTasks = this.tasks.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(task => task.completed);
        }

        // Atualiza o estado ativo dos botões de filtro (visual e ARIA attribute)
        this.filterButtons.forEach(button => {
            if (button.dataset.filter === this.currentFilter) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true'); // Define como pressionado
            } else {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false'); // Define como não pressionado
            }
        });

        // Mensagem quando não há tarefas (com ícone ilustrativo)
        if (filteredTasks.length === 0) {
            let message = '';
            let icon = '✨'; // Ícone padrão

            if (this.currentFilter === 'all') {
                message = 'Que bom! Nenhuma tarefa adicionada ainda.';
                icon = '🎉';
            } else if (this.currentFilter === 'pending') {
                message = 'Uhu! Todas as tarefas pendentes estão concluídas!';
                icon = '✅';
            } else if (this.currentFilter === 'completed') {
                message = 'Ainda não há tarefas concluídas.';
                icon = '🚀';
            }
            this.taskList.innerHTML = `
                <div class="empty-list-message" role="status" aria-live="polite">
                    <span role="img" aria-label="Ícone de ${message}">${icon}</span> <p>${message}</p>
                </div>
            `;
            return;
        }

        // Renderiza as tarefas filtradas
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.classList.add('task-item');
            if (task.completed) {
                taskItem.classList.add('completed');
            }
            taskItem.dataset.id = task.id; // Armazena o ID da tarefa no DOM

            taskItem.innerHTML = `
                <span>${task.text}</span>
                <div class="actions">
                    <button class="complete-btn" aria-label="Marcar como ${task.completed ? 'incompleta' : 'completa'}">
                        ${task.completed ? '✅' : '✔️'}
                    </button>
                    <button class="delete-btn" aria-label="Deletar tarefa">
                        ❌
                    </button>
                </div>
            `;
            this.taskList.appendChild(taskItem);
        });
    }
}

// Inicializa a aplicação quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
