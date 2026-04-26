import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
  Row,
  Column,
} from '@react-email/components';

interface RegistrationRejectedEmailProps {
  registrantName: string;
  eventTitle: string;
  eventType: string;
  eventStartDate: string;
  eventEndDate: string;
  eventVenue: string | null;
  confirmationCode: string;
  reason: string | null;
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  CAMP: 'Camp',
  FELLOWSHIP: 'Fellowship',
  SEMINAR: 'Seminar',
  WORSHIP_NIGHT: 'Worship Night',
};

export function RegistrationRejectedEmail({
  registrantName,
  eventTitle,
  eventType,
  eventStartDate,
  eventEndDate,
  eventVenue,
  confirmationCode,
  reason,
}: RegistrationRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Registration update for {eventTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Status banner */}
          <Section style={banner}>
            <Text style={bannerText}>Registration Update</Text>
          </Section>

          <Heading style={h1}>Registration Not Approved</Heading>
          <Text style={text}>Hi {registrantName},</Text>
          <Text style={text}>
            We regret to inform you that your registration for <strong>{eventTitle}</strong> was
            not approved by the event organizer.
          </Text>

          {/* Reason block */}
          {reason ? (
            <Section style={reasonBox}>
              <Text style={reasonTitle}>Reason</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>
          ) : (
            <Section style={reasonBox}>
              <Text style={reasonText}>
                No specific reason was provided. Please contact the event organizer directly
                for more information.
              </Text>
            </Section>
          )}

          {/* Event details for reference */}
          <Section style={card}>
            <Text style={sectionTitle}>Event Reference</Text>
            <Row>
              <Column>
                <Text style={detailLabel}>Event</Text>
                <Text style={detailValue}>{eventTitle}</Text>
              </Column>
              <Column>
                <Text style={detailLabel}>Type</Text>
                <Text style={detailValue}>{EVENT_TYPE_LABEL[eventType] ?? eventType}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={detailLabel}>Start Date</Text>
                <Text style={detailValue}>{eventStartDate}</Text>
              </Column>
              <Column>
                <Text style={detailLabel}>End Date</Text>
                <Text style={detailValue}>{eventEndDate}</Text>
              </Column>
            </Row>
            {eventVenue && (
              <Row>
                <Column>
                  <Text style={detailLabel}>Venue</Text>
                  <Text style={detailValue}>{eventVenue}</Text>
                </Column>
              </Row>
            )}
            <Row>
              <Column>
                <Text style={detailLabel}>Confirmation Code</Text>
                <Text style={{ ...detailValue, fontFamily: 'monospace' }}>{confirmationCode}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            If you believe this is a mistake, please reach out to the event organizer and
            reference your confirmation code above.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: 'Inter, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '40px',
  borderRadius: '8px',
  maxWidth: '560px',
};

const banner = {
  backgroundColor: '#fee2e2',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const bannerText = {
  color: '#b91c1c',
  fontSize: '14px',
  fontWeight: '700',
  margin: 0,
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 16px',
};

const text = {
  color: '#4a4a4a',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};

const reasonBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const reasonTitle = {
  color: '#991b1b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 6px',
};

const reasonText = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: 0,
};

const card = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
};

const sectionTitle = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const detailLabel = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 0 2px',
};

const detailValue = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 12px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  color: '#9ca3af',
  fontSize: '13px',
  lineHeight: '1.5',
};
