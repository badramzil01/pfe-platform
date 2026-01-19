import React, { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./styles/StudentCalendar.css";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function StudentCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showReadOnlyModal, setShowReadOnlyModal] = useState(false);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const [formData, setFormData] = useState({ title: "", description: "", type: "" });

  const loadGroups = async () => {
    const gr = await api.getMyGroups();
    setGroups(gr || []);
    if (gr?.length === 1) setSelectedGroupId(gr[0].groupId);
  };

  const loadEvents = useCallback(async () => {
    const ev = await api.getCalendarEvents(selectedGroupId);
    setEvents(ev || []);
  }, [selectedGroupId]);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) loadEvents();
  }, [currentDate, selectedGroupId, loadEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getEventsForDay = (day) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === date);
  };

  const openCreate = (day) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(date);
    setSelectedEvent(null);
    setFormData({ title: "", description: "", type: "" });
    setShowModal(true);
  };

  const openEdit = (ev) => {
    if (ev.createdBy === user.uid) {
      setSelectedEvent(ev);
      setSelectedDate(ev.date);
      setFormData({ title: ev.title, description: ev.description, type: ev.type || "" });
      setShowModal(true);
    } else {
      setSelectedEvent(ev);
      setShowReadOnlyModal(true);
    }
  };

  const openDayEvents = (day) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const eventsForDay = getEventsForDay(day);
    setDayEvents(eventsForDay);
    setSelectedDate(date);
    setShowDayEventsModal(true);
  };

  const save = async () => {
    if (!formData.title) return alert("Titre requis");

    if (selectedEvent) {
      await api.updateCalendarEvent(selectedEvent.id, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        date: selectedDate,
      });
    } else {
      await api.createCalendarEvent({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        date: selectedDate,
        groupId: selectedGroupId,
      });
    }

    setShowModal(false);
    loadEvents();
  };

  const remove = async () => {
    await api.deleteCalendarEvent(selectedEvent.id);
    setShowModal(false);
    loadEvents();
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prevMonth}>‹</button>
        <span>📅 Calendrier Étudiant - {currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
        <button onClick={nextMonth}>›</button>
      </div>

      <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
        <option value="">Sélectionner un groupe</option>
        {groups.map(g => (
          <option key={g.groupId} value={g.groupId}>{g.name}</option>
        ))}
      </select>

      <div className="calendar-content">
        <div className="calendar-grid">
          {DAYS.map(d => <div key={d} className="calendar-day-name">{d}</div>)}

          {cells.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={i} className="calendar-cell" onClick={() => day && openCreate(day)}>
                {day && <>
                  <div className="calendar-day-number">{day}</div>
                  {dayEvents.length > 1 ? (
                    <div className="calendar-event multiple-events" onClick={(e) => { e.stopPropagation(); openDayEvents(day); }}>
                      <div className="event-icon multiple">+</div>
                    </div>
                  ) : (
                    dayEvents.map(ev => (
                      <div key={ev.id} className={`calendar-event ${ev.type ? ev.type.toLowerCase().replace(' ', '-') : 'task'}`} onClick={(e) => { e.stopPropagation(); openEdit(ev); }}>
                        <div className="event-icon">
                          {ev.type ? ev.type.charAt(0).toUpperCase() : 'T'}
                        </div>
                      </div>
                    ))
                  )}
                </>}
              </div>
            );
          })}
        </div>

        <div className="calendar-legend">
          <h4>Légende des types</h4>
          <div className="legend-item">
            <div className="legend réunion"></div>
            <span>Réunion</span>
          </div>
          <div className="legend-item">
            <div className="legend taches"></div>
            <span>Taches</span>
          </div>
          <div className="legend-item">
            <div className="legend finich-taches"></div>
            <span>Finich taches</span>
          </div>
          <div className="legend-item">
            <div className="legend problem"></div>
            <span>Problem</span>
          </div>
          <div className="legend-item">
            <div className="legend presentation"></div>
            <span>Presentation</span>
          </div>
          <div className="legend-item">
            <div className="legend multiple-events"></div>
            <span>Plusieurs tâches</span>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{selectedEvent ? "Modifier tâche" : "Ajouter tâche"}</h3>

            <div className="form-group">
              <label>Titre</label>
              <input
                type="text"
                placeholder="Titre"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">Sélectionner le type</option>
                <option value="Réunion">Réunion</option>
                <option value="Taches">Taches</option>
                <option value="finich taches">finich taches</option>
                <option value="problem">problem</option>
                <option value="presentation">presentation</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-save" onClick={save}>Enregistrer</button>
              {selectedEvent && <button className="btn-delete" onClick={remove}>Supprimer</button>}
            </div>
          </div>
        </div>
      )}

      {showReadOnlyModal && (
        <div className="modal-overlay" onClick={() => setShowReadOnlyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Détails de la tâche</h3>

            <div className="form-group">
              <label>Titre</label>
              <input
                type="text"
                value={selectedEvent?.title || ""}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={selectedEvent?.description || ""}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <input
                type="text"
                value={selectedEvent?.type || ""}
                readOnly
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowReadOnlyModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showDayEventsModal && (
        <div className="modal-overlay" onClick={() => setShowDayEventsModal(false)}>
          <div className="modal-content day-events-modal" onClick={e => e.stopPropagation()}>
            <h3>Événements du {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>

            <div className="day-events-list">
              {dayEvents.map(ev => (
                <div key={ev.id} className={`day-event-item ${ev.type ? ev.type.toLowerCase().replace(' ', '-') : 'task'}`} onClick={() => {
                  setSelectedEvent(ev);
                  setShowDayEventsModal(false);
                  setShowReadOnlyModal(true);
                }}>
                  <div className="event-icon-small">
                    {ev.type ? ev.type.charAt(0).toUpperCase() : 'T'}
                  </div>
                  <div className="event-details">
                    <div className="event-title">{ev.title}</div>
                    <div className="event-type">{ev.type || 'Tâche'}</div>
                  </div>
                  <div className="event-arrow">›</div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDayEventsModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
