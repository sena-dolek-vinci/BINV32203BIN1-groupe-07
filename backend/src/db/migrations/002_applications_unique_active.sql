-- Un étudiant ne peut avoir qu'une candidature non retirée par offre.
CREATE UNIQUE INDEX applications_one_active_per_student_offer
  ON applications (offer_id, student_id)
  WHERE status IN ('IN_PROGRESS', 'SELECTED', 'REJECTED');
