import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, MapPin, Smartphone, Shield, Heart, Mail, Phone, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "À propos · SenAlert";
  }, []);

  const features = [
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: "Signalement Facile",
      description: "Signalez rapidement les problèmes urbains depuis votre mobile avec géolocalisation automatique."
    },
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: "Carte Interactive",
      description: "Visualisez en temps réel tous les signalements de votre quartier sur une carte interactive."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Participation Citoyenne",
      description: "Contribuez activement à l'amélioration de votre cadre de vie et de votre communauté."
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Suivi Transparent",
      description: "Suivez l'évolution de vos signalements et recevez des notifications de mise à jour."
    }
  ];

  const stats = [
    { number: "2,500+", label: "Signalements traités" },
    { number: "15", label: "Communes partenaires" },
    { number: "85%", label: "Taux de résolution" },
    { number: "48h", label: "Temps de réponse moyen" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">À propos de SenAlert</h1>
              <p className="text-muted-foreground">La plateforme citoyenne du Sénégal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
              S
            </div>
            <div className="text-left">
              <h2 className="text-4xl font-bold text-foreground">SenAlert</h2>
              <p className="text-xl text-muted-foreground">Plateforme citoyenne</p>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">
              Connectons les citoyens aux services publics
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              SenAlert est une plateforme innovante qui permet aux citoyens sénégalais de signaler 
              facilement les problèmes urbains et de suivre leur résolution en temps réel. 
              Ensemble, construisons des villes plus intelligentes et plus réactives.
            </p>
          </div>
        </section>

        {/* Statistics */}
        <section className="bg-muted/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-center text-foreground mb-8">
            Notre Impact
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <h3 className="text-2xl font-bold text-center text-foreground mb-8">
            Comment ça marche ?
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {feature.icon}
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="bg-primary/5 rounded-2xl p-8">
          <div className="text-center space-y-6">
            <Heart className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-2xl font-bold text-foreground">Notre Mission</h3>
            <div className="max-w-2xl mx-auto space-y-4">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Démocratiser l'accès aux services publics et améliorer la qualité de vie 
                des citoyens sénégalais grâce à la technologie. Nous croyons en une gouvernance 
                participative où chaque voix compte.
              </p>
              <p className="text-muted-foreground">
                SenAlert s'inscrit dans la vision du Sénégal numérique 2025 et contribue 
                aux objectifs de développement durable des Nations Unies.
              </p>
            </div>
          </div>
        </section>

        {/* Types de signalements */}
        <section>
          <h3 className="text-2xl font-bold text-center text-foreground mb-8">
            Types de signalements
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Propreté urbaine",
              "Éclairage public", 
              "État des routes",
              "Mobilier urbain",
              "Espaces verts",
              "Signalisation",
              "Réseaux électriques",
              "Assainissement"
            ].map((type, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-4 text-center">
                <span className="text-foreground font-medium">{type}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="bg-muted/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-center text-foreground mb-8">
            Contactez-nous
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-3">
              <Mail className="h-8 w-8 text-primary mx-auto" />
              <h4 className="font-semibold text-foreground">Email</h4>
              <p className="text-muted-foreground">contact@senalert.sn</p>
            </div>
            <div className="space-y-3">
              <Phone className="h-8 w-8 text-primary mx-auto" />
              <h4 className="font-semibold text-foreground">Téléphone</h4>
              <p className="text-muted-foreground">+221 XX XXX XX XX</p>
            </div>
            <div className="space-y-3">
              <Globe className="h-8 w-8 text-primary mx-auto" />
              <h4 className="font-semibold text-foreground">Web</h4>
              <p className="text-muted-foreground">www.senalert.sn</p>
            </div>
          </div>
        </section>

        {/* Developer Credit */}
        <section className="text-center py-8 border-t">
          <div className="space-y-3">
            <p className="text-muted-foreground">Fièrement développé par</p>
            <div className="text-xl font-bold text-primary">Digital Master Solution</div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SenAlert. Tous droits réservés.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">
              Prêt à améliorer votre quartier ?
            </h3>
            <Button 
              size="lg" 
              onClick={() => navigate("/signaler")}
              className="px-8 py-3"
            >
              Faire un signalement
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;