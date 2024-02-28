$(function () {
    console.log("begin");

    const panelKeys = {
        TODO: "todo",
        IN_PROGRESS: "in-progress",
        DONE: "done",
    };

    const allTasks = {
        todo: [],
        inProgress: [],
        completed: [],
    };

    // this is a non persistent store that will be holding items while they are being moved from one panel to the other

    const droppedTasks = {};

    // draggable config for draggable list items

    const draggableConfig = {
        revert: "invalid",
        cursor: "move",
        containment: "document",
        helper: "clone",
        opacity: 0.5,
    };

    // droppable config for droppable areas

    function filter(arr, id) {
        return arr.filter((item) => item.id !== id);
    }

    const droppableConfig = {
        drop(event, ui) {
            // ui.draggable is a jquery object, can call methods directly
            // this is the ul that we are dropping list items into
            $(this).append(ui.draggable);
            // when i drop an item, i want to know what i dropped and where i dropped it
            // drop location saved as id attribute on the ul i.e this
            let dropLocation = $(this).attr("id");
            // dropped item id saved as attribute on draggable
            let droppedItemId = ui.draggable.attr("data-item");
            // when i drop an item i want to change the drop location of the draggable
            ui.draggable.attr("data-drop-location", dropLocation);
            // from the task store
            console.log(droppedTasks[droppedItemId]);
            switch (dropLocation) {
                case panelKeys.TODO:
                    allTasks.inProgress = filter(
                        allTasks.inProgress,
                        droppedItemId
                    );
                    allTasks.completed = filter(
                        allTasks.completed,
                        droppedItemId
                    );
                    allTasks.todo = [
                        ...allTasks.todo,
                        droppedTasks[droppedItemId],
                    ];
                    break;
                case panelKeys.IN_PROGRESS:
                    allTasks.todo = filter(allTasks.todo, droppedItemId);
                    allTasks.completed = filter(
                        allTasks.completed,
                        droppedItemId
                    );
                    allTasks.inProgress = [
                        ...allTasks.inProgress,
                        droppedTasks[droppedItemId],
                    ];
                    break;
                case panelKeys.DONE:
                    allTasks.todo = filter(allTasks.todo, droppedItemId);
                    allTasks.inProgress = filter(
                        allTasks.inProgress,
                        droppedItemId
                    );
                    allTasks.completed = [
                        ...allTasks.completed,
                        droppedTasks[droppedItemId],
                    ];
                    break;
                default:
                    break;
            }
        },
    };

    const todo = $("ul#todo");
    const done = $(`ul#done`);
    const inProgress = $(`ul#in-progress`);

    todo.droppable(droppableConfig);
    done.droppable(droppableConfig);
    inProgress.droppable(droppableConfig);

    // first make sure we can collect items from form element

    const taskForm = $(`#task-form`);

    const taskInputEl = taskForm.find(`input[name="task_name"]`);
    const dueDateEl = taskForm.find(`input[name="due_date"]`);
    const descEl = taskForm.find(`textarea[name="description"]`);

    taskForm.on("submit", (e) => {
        e.preventDefault();
        const taskName = taskInputEl.val().trim();
        const dueDate = dueDateEl.val().trim();
        const description = descEl.val().trim();
        const canSubmit =
            taskInputEl.val().trim() &&
            dueDateEl.val().trim() &&
            descEl.val().trim();
        if (!canSubmit) return;
        console.log(taskName, dueDate, description);

        const today = dayjs();
        const dueDateObj = dayjs(dueDate);
        const diff = Math.ceil((dueDateObj - today) / 8.64e7);
        console.log(diff);
        const newTask = {
            taskName,
            id: crypto.randomUUID(),
            description,
            isNearlyDue: diff <= 2 && diff >= 1,
            isDue: diff === 0,
            dueDate: dueDateObj.format("LL"),
        };
        allTasks.todo = [newTask, ...allTasks.todo];
        $(e.target).trigger("reset");
        renderDraggables(allTasks.todo, todo, panelKeys.TODO);
    });

    function renderDraggables(arr, ulWrapper, associatedPanel) {
        const listString = arr
            .map((task) => {
                // storing the tasks as they're being rendered. what could possibly go wrong
                droppedTasks[task.id] = task;
                return `<li class="item" data-item="${task.id}" data-drop-location="${associatedPanel}">
                                <div class="card">
                                    <div class="card-header">
                                        <h4 class="card-title">
                                            ${task.taskName}
                                        </h4>
                                    </div>
                                    <div class="card-body">
                                        <p class="card-text">
                                            ${task.description}
                                        </p>
                                        <p class="card-text">
                                            ${task.dueDate}
                                        </p>

                                        <button data-delete="task" href="#" class="btn custom-btn">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </li>`;
            })
            .join("");

        const listItemComp = $(listString);
        ulWrapper.html(listItemComp);
        ulWrapper.find(`li.item`).draggable(draggableConfig);
    }
});
